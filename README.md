# RSSFeedBot
A bot built to parse, learn &amp; provide RSS feed data. Built using the Microsoft Bot Framework.

##Setting up the bot
Please generate a Translator Key on Microsoft Azure (Cognitive Services APIs -> Translator Text API)

Replace the placeholder **BING_TRANSLATE_KEY** with this key

You will also need to create a LUIS.ai endpoint

Once you have created the following intents, train the model and then click publish.

Replace the placeholder **LUIS_ENDPOINT_URL** with this url

####Intents
1. genConvo
  * This is used when the user says "Hi", "Hello" etc. Train it to your liking.
2. loadRSS
  * This is the intent which is called when the user wants to parse a RSS feed into the bot carousel
3. genVulgarity
  * For lols, if the user decides to scold the bot, you may invoke this intent
4. getLanguages
  * This intent will list out all the available translation shortcodes (Eg. en, ko, in)

##Connecting with an emulator
[Download the Bot Framework Emulator](https://emulator.botframework.com/)

1. Run the bot on Node.js with the following command "node app.js"
  * Make sure you change the directory of your console to the folder it is saved in first
2. Input the URL as http://localhost:3978/api/messages
3. Leave the Microsoft App ID and Microsoft App Password fields empty and then connect
