// Reference the packages we require so that we can use them in creating the bot
var restify = require('restify');
var builder = require('botbuilder');
var feedparser = require('feedparser-promised');

//=========================================================
// Bot Setup
//=========================================================

//Setup LUIS
var luisRecognizer = new builder.LuisRecognizer('LUIS_ENDPOINT_URL');
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
.matches()
    .matches('genVulgarity', '/avoidVulgar')
    .onDefault(builder.DialogAction.send("Sorry, I didn't understand what you said."));

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', intentDialog);

bot.dialog('/initiateConversation', [function (session){
        session.send("Hello there! I'm a RSS Feed Bot.\n\nSend me a URL to get started!");
    }
]);

bot.dialog('/getRSS', function (session, args){
        console.log(session.message.text);
        var rssURL = builder.EntityRecognizer.findEntity(args.entities, 'builtin.url');

        console.log(rssURL);
        if (rssURL) {
            var url = rssURL.entity;
            session.send('Looking for RSS feed of \'%s\'...', url);

            var count = 0;
            var finalMessage = "RSS Feed for "+url+"\n\n";

            feedparser.parse(url).then(function (items) {
                try{
                    items.forEach(function (item) {
                        if(count<20){
                            count++;
                            console.log('title: ', item.title);
                            finalMessage = finalMessage + "Article "+count+": "+item.title+"\n\n";                        
                        }
                    });

                session.send(finalMessage);

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