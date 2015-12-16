# twitch-bot

Made by: skhmt

Using:
* https://github.com/nwjs/nw.js/
* https://jquery.com/
* https://jqueryui.com/
* https://github.com/martynsmith/node-irc/
* https://github.com/plotly/plotly.js/


To build on Windows:
* Get nw.js
* Pull everything from src on this repository
* Zip it to bot.zip (top level)
* Rename it to bot.nw
* Put bot.nw into the nw.js folder
* Open a console window (shift-rightclick in the folder)
* Run: copy /b nw.exe+bot.nw bot.exe
* You only need bot.exe, nw.pak, and icudtl.dat to run the program... for now at least.

Note: if you build your own version, you'll need to get your own clientid and make your own oauth page. Don't use this actual page, although you may copy and use it on your own site: https://github.com/Skhmt/skhmt.github.io/blob/master/bot/oauth.html
