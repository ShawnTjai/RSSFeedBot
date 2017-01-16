// Reference the packages we require so that we can use them in creating the bot
var restify = require('restify');
var builder = require('botbuilder');
var feedparser = require('feedparser-promised');

//=========================================================
// Bot Setup
//=========================================================

//Setup LUIS
var luisRecognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v2.0/apps/ff6b0484-c17d-4fa8-a749-5ee96b2cf84e?subscription-key=b7dbaddbc50940a7b146c5e6447c30c4&verbose=true');
var intentDialog = new builder.IntentDialog({recognizers: [luisRecognizer]});

// Setup Restify Server
// Listen for any activity on port 3978 of our local server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//LUIS Intents
intentDialog.matches('genConvo', '/initiateConversation')
    .matches('loadRSS', '/getRSS')
    .matches('genVulgarity', '/avoidVulgar')
    .onDefault(builder.DialogAction.send("Sorry, I didn't understand what you said."));

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', intentDialog);

bot.dialog('/initiateConversation', function (session){
        session.endDialog("Hello there! I'm a RSS Feed Bot.\n\nSend me a URL to get started!");
    }
);

bot.dialog('/getRSS', function (session, args){
        console.log(session.message.text);
        var rssURL = builder.EntityRecognizer.findEntity(args.entities, 'builtin.url');

        console.log(rssURL);
        if (rssURL) {
            var url = rssURL.entity;
            session.send('Looking for RSS feed of \'%s\'...', url);

            var count = 0;
            var finalMessage = "RSS Feed for "+url+"\n\n";
            var cards = [];

            feedparser.parse(url).then(function (items) {
                try{
                    items.forEach(function (item) {
                        if(count<5){
                            count++;
                            console.log('title: ', item.title);
                            finalMessage = finalMessage + "Article "+count+": "+item.title+"\n\n";  

                            var tmp = new builder.HeroCard(session)
                            .title(item.title)
                            .text(item.summary)
                            .images([
                                builder.CardImage.create(session, item.image.url)
                            ])
                            .buttons([
                                builder.CardAction.openUrl(session, item.link, 'Read More')
                            ]);

                            cards[count] = tmp;
                        }
                    });

                var reply = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(cards);

                session.endDialog(reply);

                } catch (err){
                    console.log(err);
                }
            }).catch(function (error) {
                console.log('error: ', error);
            });
        }
    }
);

bot.dialog('/avoidVulgar', [function (session){
        builder.Prompts.choice(session, "That's rude, take that back!", "Sorry|No");
    }, function (session, results){
        if (results.response && results.response.entity !== 'No') {
            session.sendTyping();
            session.endDialog("Apology accepted.");
        } else {
            session.endDialog("K. Talk to me when you've learnt some manners.");
        }
    }
]);

function getCards(session){
    return [
        new builder.HeroCard(session)
            .title('Azure Storage')
            .subtitle('Massively scalable cloud storage for your applications')
            .text('Store and help protect your data. Get durable, highly available data storage across the globe and pay only for what you use.')
            .images([
                builder.CardImage.create(session, 'https://acom.azurecomcdn.net/80C57D/cdn/mediahandler/docarticles/dpsmedia-prod/azure.microsoft.com/en-us/documentation/articles/storage-introduction/20160801042915/storage-concepts.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/storage/', 'Learn More')
            ]),

        new builder.ThumbnailCard(session)
            .title('DocumentDB')
            .subtitle('Blazing fast, planet-scale NoSQL')
            .text('NoSQL service for highly available, globally distributed apps—take full advantage of SQL and JavaScript over document and key-value data without the hassles of on-premises or virtual machine-based cloud database options.')
            .images([
                builder.CardImage.create(session, 'https://sec.ch9.ms/ch9/29f4/beb4b953-ab91-4a31-b16a-71fb6d6829f4/WhatisAzureDocumentDB_960.jpg')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/documentdb/', 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title('Azure Functions')
            .subtitle('Process events with serverless code')
            .text('Azure Functions is a serverless event driven experience that extends the existing Azure App Service platform. These nano-services can scale based on demand and you pay only for the resources you consume.')
            .images([
                builder.CardImage.create(session, 'https://azurecomcdn.azureedge.net/cvt-8636d9bb8d979834d655a5d39d1b4e86b12956a2bcfdb8beb04730b6daac1b86/images/page/services/functions/azure-functions-screenshot.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/functions/', 'Learn More')
            ]),

        new builder.ThumbnailCard(session)
            .title('Cognitive Services')
            .subtitle('Build powerful intelligence into your applications to enable natural and contextual interactions')
            .text('Enable natural and contextual interaction with tools that augment users\' experiences using the power of machine-based intelligence. Tap into an ever-growing collection of powerful artificial intelligence algorithms for vision, speech, language, and knowledge.')
            .images([
                builder.CardImage.create(session, 'https://azurecomcdn.azureedge.net/cvt-8636d9bb8d979834d655a5d39d1b4e86b12956a2bcfdb8beb04730b6daac1b86/images/page/services/functions/azure-functions-screenshot.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/functions/', 'Learn More')
            ])
    ];
}