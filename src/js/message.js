/*
	Copyright (C) 2016  skhmt

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation version 3.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	message.js deals with raw messages, necessary if using ircv3 (twitch.tv/tags)
*/

// gets a message object
function parseMsg( command, args, user ) {
	if ( command == "JOIN" ) {
		msgJoin( user, args );
		return;
	}

	switch( args[1] ) {
		case "NOTICE":
			msgNotice( args );
			break;
		case "PRIVMSG":
			msgPriv( command, args );
			break;
		case "ROOMSTATE":
			msgRoom( command, args );
			break;
		default:
			break;
	}
}

/* NOTICE:
	Command: @msg-id=host_on
	Args 0: tmi.twitch.tv NOTICE #skhmt :Now hosting CoolidgeHD.
*/
function msgNotice( args ) {
	var output = "* ";

	output += args[3].substring(1); // removing the :

	// reconstructing the string after it was split by " "
	for ( var i = 4; i < args.length; i++ ) {
		output += ` ${args[i]}`;
	}

	log( output );
}

/* MESSAGE:
	Command: @color=#1E90FF;display-name=Skhmt;emotes=;mod=0;subscriber=0;turbo=0;user-id=71619374;user-type=mod
 @color=#1E90FF;display-name=Skhmt;emotes=;mod=0;room-id=47520292;subscriber=1;turbo=0;user-id=71619374;user-type=
	Args 0: skhmt!skhmt@skhmt.tmi.twitch.tv PRIVMSG #skhmt :test
*/
function msgPriv( command, args ) {

	var commands = command.split( ";" ); console.log("commands: " + commands);
	var color = "#d2691e";
	var mod = false;
	var subscriber = false;
	var turbo = false;
	var from = "";

	for ( var i = 0; i < commands.length; i++ ) {
		commands[i] = commands[i].split( "=" );
		var tempParamName = commands[i][0];
		var tempParamValue = commands[i][1];
		if (tempParamName == "display-name") {
			console.log("display-name: " + tempParamValue);
			if (tempParamValue === "") { // some people don't have a display-name, so getting it from somewhere else as a backup
				var tempArgs = args[0].split( "!" );
				from = tempArgs[0];
			} else {
				from = tempParamValue;
			}
		}
		if ( tempParamName == "@color" && tempParamValue != "" ) {
			color = tempParamValue;
		}
		if ( tempParamName == "mod" && tempParamValue == "1" ) {
			mod = true;
		}
		if ( tempParamName == "subscriber" && tempParamValue == "1" ) {
			subscriber = true;
		}
		if ( tempParamName == "turbo" && tempParamValue == "1" ) {
			turbo = true;
		}

	}

	// writing output and setting timestamp
	var output = getTimeStamp() + " ";

	// output icons and such
	if ( settings.channel.substring(1) === from.toLowerCase() ) {
		output += "<img src='http://chat-badges.s3.amazonaws.com/broadcaster.png'>";
	}
	if ( mod ) {
		output += "<img src='http://chat-badges.s3.amazonaws.com/mod.png'>";
	}
	if ( subscriber ) {
		output += `<img src='${subBadgeUrl}' />`;
	}
	if ( turbo ) {
		output += "<img src='http://chat-badges.s3.amazonaws.com/turbo.png'>";
	}

	// output FROM info
	output += `<b style='color: ${color};'>${from}</b>`;


	// reconstructing the string after it was split by " "
	var text = args[3].substring(1); // first word, removed the colon

	args.splice(0,4);
	var lessargs = args.join(" "); // all other words

	 // ACTION:
		// Command: @color=#1E90FF;display-name=Skhmt;emotes=;subscriber=0;turbo=0;user-id=71619374;user-type=
		// Args 0: skhmt!skhmt@skhmt.tmi.twitch.tv PRIVMSG #skhmt :ACTION does things

	if ( text === "\001ACTION" ) {
		text = lessargs; // text is now all words after "ACTION"
		output += `<span style='color: ${color};'>
			${text.replace(/</g,"&lt;").replace(/>/g,"&gt;")}
			</span>`;

		moderation( from, mod, text );
		return log( output );
	}
	else { // not an action
		text += " " + lessargs; // text is merged with lessargs to make up the entire text string
		output += `<b>:</b> ${text.replace(/</g,"&lt;").replace(/>/g,"&gt;")}`;

		// if it's a command, send to parseCommand
		if ( text.substring(0,1) === cmdSettings.symbol ) {
			parseCommand( text, from, mod, subscriber );
		}

		moderation( from, mod, text );

		return log( output );
	}
}


/* ROOMSTATE
	command: @broadcaster-lang=;r9k=0;slow=0;subs-only=0
		     @broadcaster-lang=;r9k=1;slow=120;subs-only=1
	Args 0: tmi.twitch.tv ROOMSTATE #skhmt
*/
function msgRoom( command, args ) {
	var commands = command.split(";");
	var r9k = commands[1].substring(4);
	var slow = commands[2].substring(5);
	var subsOnly = commands[3].substring(10);

	if ( r9k == 0 && slow == 0 && subsOnly == 0 ) {
		log( `* No roomstate options set for ${args[2]}` );
	} else {
		var output = `* Roomstate options for ${args[2]}:`;
		if ( r9k === 1 ) output += " r9k";
		if ( slow > 0 ) output += ` slow(${slow})`;
		if ( subsOnly === 1 ) output += " subscribers-only";

		log( output );
	}
}


/* JOIN:
	Command: JOIN
	User: nightbot
	Args 0: #m3rchant
*/
function msgJoin( user, args ) {
	// log( `* ${user} has joined ${args[0]}` );

	// pushing to recent events
	var td = new Date();
	recentEvents.unshift({"time": td.getTime(), "type": "JOIN", "text": user});
}

/* MODE:
	Command: MODE
	Args 0: #m3rchant //channel
	Args 1: +o //op
	Args 2: m3rchant //username
*/
