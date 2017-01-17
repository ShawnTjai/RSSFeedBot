// References
var restify = require('restify');
var builder = require('botbuilder');
var feedparser = require('feedparser-promised');
var validUrl = require('valid-url');
var translator = require('mstranslator');

//Setup Translator
var client = new translator({
  api_key: "97509730891a4301b8d176b9fc8ba3e5" // use this for the new token API. 
}, true);

//Setup LUIS
var luisRecognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v2.0/apps/ff6b0484-c17d-4fa8-a749-5ee96b2cf84e?subscription-key=b7dbaddbc50940a7b146c5e6447c30c4&verbose=true');
var intentDialog = new builder.IntentDialog({recognizers: [luisRecognizer]});

// Listen on port 3978
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Initialise Connector
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
    .matches('getLanguages','/availableLanguages')
    .onDefault(builder.DialogAction.send("Sorry, I didn't understand what you said."));

// Bot Dialogs

bot.dialog('/', intentDialog);

bot.dialog('/initiateConversation', function (session){
        session.endDialog("Hello there! I'm a RSS Feed Bot.\n\nSend me a URL to get started!");
    }
);

bot.dialog('/availableLanguages', function (session){
        client.getLanguagesForTranslate(function(err, data){
            session.endDialog("Here are the available languages:\n\n(Refer to: https://www.loc.gov/standards/iso639-2/php/code_list.php)\n\n"+data);
        });
    }
);

var cards = [];
var numOfArticles = 5;//Change this value to choose num of articles

bot.dialog('/getRSS', function (session, args){
        cards = [];
        console.log(session.message.text);
        var rssURL = builder.EntityRecognizer.findEntity(args.entities, 'builtin.url');
        var translateLang = builder.EntityRecognizer.findEntity(args.entities, 'language');

        console.log(rssURL);
        if (rssURL) {
            var url = rssURL.entity;
            
            if(validUrl.isUri(url)){
                session.send('Looking for RSS feed of \'%s\'...', url);

                var count = 0;
                var cardCount = 0;
                var finalMessage = "RSS Feed for "+url+"\n\n";
                var obj = {};

                feedparser.parse(url).then(function (items) {
                    try{
                        items.forEach(function (item) {
                            if(count<numOfArticles){
                                count++;
                                finalMessage = finalMessage + "Article "+count+": "+item.title+"\n\n";

                                if(translateLang){
                                    obj.toLang = translateLang.entity;

                                    var paramsLang = {
                                        text: item.description
                                    };

                                    client.detect(paramsLang, function(err, data){
                                        obj.oriLang = data;
                                        console.log("Detected Language: "+obj.oriLang);

                                        var paramsDesc = {
                                            text: item.description,
                                            from: obj.oriLang,
                                            to: obj.toLang
                                        };

                                        var paramsTitle = {
                                            text: item.title,
                                            from: obj.oriLang,
                                            to: obj.toLang
                                        };

                                        client.translate(paramsDesc, function(err, data){
                                            obj.desc = data;
                                            console.log("Translating to "+obj.toLang);
                                            console.log(obj.desc);

                                            client.translate(paramsTitle, function(err, data){
                                                obj.title = data;
                                                console.log(obj.title);

                                                console.log("Article "+cardCount+": "+obj.title);

                                                var tmp = new builder.HeroCard(session)
                                                    .title(obj.title)
                                                    .subtitle("Translated from "+obj.oriLang+" to "+obj.toLang)
                                                    .text(obj.description)
                                                    .images([
                                                        builder.CardImage.create(session, item.image.url)
                                                    ])
                                                    .buttons([
                                                        builder.CardAction.openUrl(session, item.link, 'Read More')
                                                    ]);

                                                cards[cardCount] = tmp;
                                                cardCount++;

                                                if(cardCount == numOfArticles){
                                                    var reply = new builder.Message(session)
                                                        .attachmentLayout(builder.AttachmentLayout.carousel)
                                                        .attachments(cards);

                                                    session.endDialog(reply);
                                                }
                                            });
                                        });
                                    });                                    
                                } else {
                                    obj.title = item.title;
                                    obj.description = item.description;

                                    var tmp = new builder.HeroCard(session)
                                                .title(obj.title)
                                                .text(obj.description)
                                                .images([
                                                    builder.CardImage.create(session, item.image.url)
                                                ])
                                                .buttons([
                                                    builder.CardAction.openUrl(session, item.link, 'Read More')
                                                ]);

                                            cards[count] = tmp;
                                }
                            }
                        });

                        if(!translateLang){
                            var reply = new builder.Message(session)
                                        .attachmentLayout(builder.AttachmentLayout.carousel)
                                        .attachments(cards);

                            session.endDialog(reply);
                        }
                        console.log(finalMessage);  
                    } catch (err){
                        console.log(err);
                    }
                }).catch(function (error) {
                    session.endDialog("There is an error with your URL. Please enter a valid RSS feed.");
                    console.log('error: ', error);
                });
            } else {
                session.endDialog("Please enter a valid RSS url.");
            }
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