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

 // vars
var clientid = "3y2ofy4qcsvnaybw9ogdzwmwfode8y0"; /* this is the (public) client_id of KoalaBot. */
var bot;
var server = "irc.twitch.tv";
var fs;
var logFile;
var execPath;
var hosts = [];
var viewers = [];
var startDate = new Date();
var subBadgeUrl = "";
var permitted = [];
var emoticons = [];
var currentUsers = [];
var recentEvents = [];
var mainwin;
var gui;
var sql;

var rawIrcOn = false;
var commandsOn = true;

var settings = {
	access_token: "",
	username: "",
	channel: "",
	id: "",
	theme: "default"
};

var title = "KoalaBot 0.9.3";

$(document).ready( function() {

	$("title").html(title);

	var path = require( "path" );
	fs = require( "fs" );

	if ( process.platform == "win32" ) {
		execPath = `${path.dirname( process.execPath )}/`;
	}
	else {
		execPath = "";
	}

	sql = require( 'sql.js' );

	gui = require("nw.gui");
	mainwin = gui.Window.get();
	mainwin.on("close", function() {
	  this.hide(); // Pretend to be closed already
	  console.log("Final save");
	  save();
	  this.close(true);
	} );

	$("#getOauthLink").click( setupOauth );

	$("#changeChannel").click( function() {
		var newchan = $("#getChannelField").val().toLowerCase();
		if ( newchan.substring(0,1) !== "#" ) { // if the user forgot the #, add it
			newchan = `#${newchan}`;
			$("#getChannelField").val( newchan );
		}

		if ( newchan !== settings.channel ) { // if the channel is actually different
			bot.part( settings.channel, function(){
				log( `* Parting ${settings.channel}` );
			} );
			bot.join( newchan, function() {
				log( `* Joining ${newchan}` );
				settings.channel = newchan;
				onChannelEnter();
			} );
		}
	} );

	// making logs and settings directories
	try { fs.accessSync( `${execPath}logs` ); }
	catch (e) { fs.mkdirSync( `${execPath}logs` ); }

	try { fs.accessSync( `${execPath}txt` ); }
	catch (e) { fs.mkdirSync( `${execPath}txt` ); }

	try { fs.accessSync( `${execPath}settings` ); }
	catch (e) { fs.mkdirSync( `${execPath}settings` ); }

	// Making sure themes folder exists
	try { fs.accessSync( `${execPath}themes` ); }
	catch (e) { fs.mkdirSync( `${execPath}themes` ); }

	// Checking if default.css exists in \themes\
	try { fs.accessSync( `${execPath}themes/default.css` ); }
	catch (e) { // if it doesn't exist, basically copy+paste it
		var defaultcss = fs.readFileSync("default.css", "utf8");
		fs.writeFileSync(`${execPath}themes/default.css`, defaultcss, "utf8");
	}
	$("#botTheme").attr( "href", `${execPath}themes/default.css` );

	$("#botThemeCurrent").html( "default" );
	settings.theme = "default";


	// Setting up the chat log
	var d = new Date();
	var dmonth = d.getMonth() + 1;
	dmonth = dmonth < 10 ? "0" + dmonth : dmonth;
	var dday = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
	var dhour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
	var dmin = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
	var dsec = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
	var logname = `chatlog_${d.getFullYear()}-${dmonth}-${dday}_${dhour}-${dmin}-${dsec}.log`;

	logFile = `${execPath}logs/${logname}`;

	// setting up moderation area
	moderationSetup();

	// setting up the commands area
	cmdSetup();

	// setting up the points
	pointsSetup();

	// getting twitch and bttv emoticons
	getEmoticons();

	// setting up timed messages
	timedMessagesSetup();

	// setting up stats stuff
	statsSetup();

	// setting up the raffle tab
	raffleSetup();

	// setting up songs
	songsSetup();

	// set up the events part
	eventSetup();

	// set up the quotes
	quoteSetup();

	// starting the timer
	timerSetup();

	// set up mods
	apiSetup();

	// loading settings.ini
	try {
		var readFile = fs.readFileSync( `${execPath}settings/settings.ini` );
		settings = $.parseJSON( readFile );

		// Setting up config area
		$("#getOauthField").val( settings.access_token );
		$("#getChannelField").val( settings.channel );
		$("#displayName").html( settings.username );

		// Setting up theme
		try {
			fs.readFileSync( `${execPath}themes/${settings.theme}` );
			$("#botTheme").attr( "href", `${execPath}themes/${settings.theme}` );
			$("#botThemeCurrent").html( settings.theme.split(".")[0] );
		} catch (e) {}

		// Running tabs
		runChat();
		onChannelEnter();
	} catch (e) {
		$("#getOauthField").val( "" );
	}

	//	populate the #botThemeList
	fs.readdir(`${execPath}themes`, function(err, files){

		for ( var f = 0; f < files.length; f++ ) {
			var splitName = files[f].split(".");
			if ( splitName[1] == "css" ) {
				$("#botThemeList").append(`
					<option value="${files[f]}">
						${splitName[0]}
					</option>`);
			}
		}
	} );

	$("#botThemeChange").click(function() {
		var tempTheme = $("#botThemeList").val();
		$("#botTheme").attr( "href", `${execPath}themes/${tempTheme}` );
		$("#botThemeCurrent").html(tempTheme.split(".")[0]);
		settings.theme = tempTheme;
		return false;
	} );



	fs.writeFile( `${execPath}txt/host-session.txt`, "" );
	fs.writeFile( `${execPath}txt/follow-session.txt`, "" );
	fs.writeFile( `${execPath}txt/sub-session.txt`, "" );
} );

function getUsername() {
	var token = settings.access_token.substring(6);
	$.getJSON(
		"https://api.twitch.tv/kraken",
		{
			"client_id" : clientid,
			"api_version" : 3,
			"oauth_token" : token
		},
		function( response ) {
			settings.username = response.token.user_name;
			$("#displayName").html( settings.username );

			settings.channel = "#" + settings.username;
			$("#getChannelField").val( settings.channel );

			runChat();
			onChannelEnter();
		}
	);
}


function runChat() {

	try {
		bot.disconnect( function() {
			log( `* Disconnected from ${server}` );
		});
	} catch (e) {}

	var irc = require( "irc" );

	var config = {
		//channels: [settings.channel],
		server: server,
		username: settings.username,
		nick: settings.username,
		password: settings.access_token,
		sasl: true,
		autoConnect: false
	};

	bot = new irc.Client( config.server, config.nick, config );

	bot.connect(5, function() {
		log( `* Connected to ${server}` );
	} );

	bot.addListener( "registered", function( message ) {
		bot.send( "CAP REQ", "twitch.tv/membership" );
		bot.send( "CAP REQ", "twitch.tv/commands" );
		bot.send( "CAP REQ", "twitch.tv/tags" )
		bot.join( settings.channel, function() {
			log( "* Joining " + settings.channel );
		} );
	} );

	bot.addListener( "error", function( message ) {
		log( "* Error: " + message );
	} );

	bot.addListener( "raw", function( message ) {
		var args = message.args[0].split(" ");
		var command = message.command;
		var user = message.user;

		if (rawIrcOn) { // logging all raw commands
			log( `<b>rawcmd: </b>${message.rawCommand} |
				<b>user: </b>${message.user} |
				<b>host: </b>${message.host} |
				<b>args: </b> ${JSON.stringify(message.args)}` );
		}

		if ( message.user == "twitchnotify" ) { // if it's a sub notification
			subNotify(message.args[1]);
		} else {
			parseMsg(command, args, user);
		}
	} );
}


// This is run every time a channel is entered
function onChannelEnter() {

	// getting when you change channel because it's channel-specific
	getEmoticonsBTTV();

	getFollowers();

	// get subscriber image URL of the channel you're in
	$.getJSON(
		`https://api.twitch.tv/kraken/chat/${settings.channel.substring(1)}/badges`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function( response ) {
			if ( response.subscriber != null ) {
				subBadgeUrl = response.subscriber.image;
			}
		}
	);

	// get id of the channel you're in and current game and stream title
	$.getJSON(
		`https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function( response ) {
			settings.id = response._id;
			eventSettings.isPartnered = response.partner;
			$("#gameField").val( response.game );
			$("#statusField").val( response.status );

			$("title").html(`${response.status} &mdash; ${response.game} &mdash; ${title}`);
		}
	);
}

function updateUserlist() {
	if ( settings.channel.substring(1) == "" || settings.channel.substring(1) == null ) return;

	$.ajax( {
		dataType: "json",
		url: `https://tmi.twitch.tv/group/user/${settings.channel.substring(1)}/chatters`,
		data: {
			"client_id": clientid,
			"api_version": 3
		},
		success: function (response) {

			if (!response.chatters) return ; // didn't load a user yet

			exportViewers(response.chatter_count);
			currentUsers = []; // {username: string, role: string}

			updateViewerCount(response.chatter_count);

			var output = "";

			var staffLen = response.chatters.staff.length;
			if (staffLen > 0) {
				output += `<p> <b style='color: #6d35ac;'>STAFF (${staffLen})</b> <br> `;
				for (var i = 0; i < staffLen; i++) {
					var tempuser = response.chatters.staff[i];
					output += `${tempuser} <br> `;
					currentUsers.push({"username": tempuser, "role": "staff"});
				}
				output += "</p> ";
			}

			var modLen = response.chatters.moderators.length;
			if (modLen > 0) {
				output += `<p> <b style='color: #34ae0a;'>MODS (${modLen})</b> <br> `;
				for (var i = 0; i < modLen; i++) {
					var tempuser = response.chatters.moderators[i];
					output += `${tempuser} <br> `;
					currentUsers.push({"username": tempuser, "role": "moderator"});
				}
				output += "</p> ";
			}

			var adminLen = response.chatters.admins.length;
			if (adminLen > 0) {
				output += `<p> <b style='color: #faaf19;'>ADMINS (${adminLen})</b> <br> `;
				for (var i = 0; i < adminLen; i++) {
					var tempuser = response.chatters.admins[i];
					output += `${tempuser} <br> `;
					currentUsers.push({"username": tempuser, "role": "admin"});
				}
				output += "</p> ";
			}

			var globalLen = response.chatters.global_mods.length;
			if (globalLen > 0) {
				output += `<p> <b style='color: #1a7026;'>GLOBAL MODS (${globalLen})</b> <br> `;
				for (var i = 0; i < globalLen; i++) {
					var tempuser = response.chatters.global_mods[i];
					output += `${tempuser} <br> `;
					currentUsers.push({"username": tempuser, "role": "globalmod"});
				}
				output += "</p> ";
			}

			var viewLen = response.chatters.viewers.length;
			if (viewLen > 0) {
				output += `<p> <b style='color: #2e7db2;'>VIEWERS (${viewLen})</b> <br> `;
				for (var i = 0; i < viewLen; i++) {
					var tempuser = response.chatters.viewers[i];
					output += `${tempuser} <br> `;
					currentUsers.push({"username": tempuser, "role": "viewer"});
				}
				output += "</p> ";
			}

			$("#userlist").html(output);
		},
		timeout: 2000
	} );
}

function updateViewerCount( viewerCount ) {
	$.getJSON(
		`https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}/follows`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response){
			var followerCount = response._total;
			$("#viewercount").html( `
				<span class="glyphicon glyphicon-user text-info"></span>
				&nbsp;&nbsp;&nbsp;${viewerCount.toLocaleString()}
				<br>
				<span class="glyphicon glyphicon-heart text-danger"></span>
				&nbsp;&nbsp;&nbsp;${followerCount.toLocaleString()}` );

			fs.writeFile( `${execPath}txt/follower-total-count.txt`, `${followerCount.toLocaleString()}` );
			fs.writeFile( `${execPath}txt/viewer-current-count.txt`, `${viewerCount.toLocaleString()}` );
		}
	);
}

function getEmoticons() {
	$.getJSON(
		"https://api.twitch.tv/kraken/chat/emoticons",
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function( response ) {
			if ( "emoticons" in response ) {
				for (var i in response.emoticons) {
					emoticons[response.emoticons[i].regex] = response.emoticons[i].images[0].url;
				}
			}
			else {
				setTimeout( function() { getEmoticons(); }, 5*1000 );
			}
		}
	);

}

function getEmoticonsBTTV() {
	$.getJSON(
		`https://api.betterttv.net/2/channels/${settings.channel.substring(1)}`,
		{},
		function ( response ) {
			if ( "emotes" in response ) {
				for (var i in response.emotes) {
					emoticons[response.emotes[i].code] = `https://cdn.betterttv.net/emote/${response.emotes[i].id}/1x`;
				}
			}
		}
	);

	$.getJSON(
		"https://api.betterttv.net/emotes",
		{},
		function ( response ) {
			if ( "emotes" in response ) {
				for (var i in response.emotes) {
					emoticons[response.emotes[i].regex] = `https:${response.emotes[i].url}`;
				}
			}
		}
	);
}

function writeEmoticons( message ) {
	var output = "";
	var text = message.split(" ");

	// for each word, check if it's an emoticon and if it is, output the url instead of the text
	for( var i = 0; i < text.length; i++ ) {
		var word = text[i];
		if ( emoticons[word] ) {
			output += `<img src="${emoticons[word]}"> `;
		}
		else {
			output += `${word} `;
		}
	}

	return output;
}

function log( message ) {
	var out = document.getElementById("console");

	// scrollHeight = element's total height including overflow
	// clientHeight = element's height including padding excluding horizontal scroll bar
	// scrollTop = distance from an element's top to its topmost visible content, it's 0 if there's no scrolling needed
	// allow 1px inaccuracy by adding 1

	// if it's scrolled to the bottom within 20px before a chat message shows up, set isScrolledToBottom to true
	var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 20;

	// add message
	// var start = $.now();
	$("#console").append( `${writeEmoticons(message)} <br>` );
	// console.log(`${parseInt($.now())-parseInt(start)}ms : "${message}"`);

	// if it was scrolled to the bottom before the message was appended, scroll to the bottom
	if( isScrolledToBottom )
		out.scrollTop = out.scrollHeight - out.clientHeight;

	// remove html tags before writing to the log
	var wrapped = $(`<div>${message}</div>`);
	message = wrapped.text();

	// write to log
	fs.appendFile( logFile, `${message}\r\n`, function ( err ) {
		if ( err ) $("#console").append(`* Error writing to log <br>`);
	} );
}

function chat() {
	// get the chat input box value
	var text = $("#chatText").val();

	// output it to the console
	log( `${getTimeStamp()} <b>&gt;</b> ${text.replace(/</g,"&lt;").replace(/>/g,"&gt;")}` );

	// check if it was a command...
	if ( text.substring(0, 1) === cmdSettings.symbol ) {
		parseCommand( text, settings.username, true, true);
	}
	else {
		// send the data to the irc server
		bot.say( settings.channel, text );
	}

	// clear the chat input box
	$("#chatText").val("");
}

function getTimeStamp() {
	var dt = new Date();
	var hrs = dt.getHours();
	var mins = dt.getMinutes();
	// var secs = dt.getSeconds();

	if ( hrs < 10 ) hrs = "0" + hrs;
	if ( mins < 10 ) mins = "0" + mins;
	// if ( secs < 10 ) secs = "0" + secs;

	return `[${hrs}:${mins}]`;
}

function save() {
	// saving settings.ini
	fs.writeFile( `${execPath}settings/settings.ini`, JSON.stringify( settings ) );

	// saving modSettings.ini
	fs.writeFile( `${execPath}settings/modSettings.ini`, JSON.stringify( modSettings ) );

	// saving timedMessages.ini
	fs.writeFile( `${execPath}settings/timedMessages.ini`, JSON.stringify( timedMessages ) );

	// saving cmdSettings.ini
	fs.writeFile( `${execPath}settings/cmdSettings.ini`, JSON.stringify( cmdSettings ) );

	// saving raffleSettings.ini
	fs.writeFile( `${execPath}settings/raffleSettings.ini`, JSON.stringify( raffleSettings ) );

	// saving eventSettings.ini
	fs.writeFile( `${execPath}settings/eventSettings.ini`, JSON.stringify( eventSettings ) );

	// saving songSettings.ini
	fs.writeFile( `${execPath}settings/songSettings.ini`, JSON.stringify( songSettings ) );

	// saving defaultCommands.ini
	fs.writeFile( `${execPath}settings/defaultCommands.ini`, JSON.stringify( defaultCommands ) );

	// saving pointsSettings.ini
	if ( pointsSettings.users ) {
		var tempUserArray = [];
		var keyList = Object.keys( pointsSettings.users );
		for (var i = 0; i < keyList.length; i++) {
			var tempName = keyList[i];
			tempUserArray.push( {
				username: tempName,
				totalPoints: pointsSettings.users[tempName].totalPoints,
				currentPoints: pointsSettings.users[tempName].currentPoints
			} );
		}
		var tempPointsSettings = {
			enabled: pointsSettings.enabled,
			unit: pointsSettings.unit,
			regularPoints: pointsSettings.regularPoints,
			pointsPerUpdate: pointsSettings.pointsPerUpdate,
			minutesPerUpdate: pointsSettings.minutesPerUpdate,
			ranks: pointsSettings.ranks,
			users: tempUserArray
		};

		fs.writeFile( `${execPath}settings/pointsSettings.ini`, JSON.stringify( tempPointsSettings ) );
	}

	console.log("Settings saved");
}

function setupOauth() {
	$("#oauthFrame").attr("src", `https://api.twitch.tv/kraken/oauth2/authorize?
	response_type=token&
	client_id=3y2ofy4qcsvnaybw9ogdzwmwfode8y0&
	redirect_uri=http://localhost:3000/oauth.html&
	scope=channel_editor+chat_login&
	force_verify=true`);
	var express = require( "express" );
	var app = express();
	app.use( express.static( "public" ) );
	app.get( "/oauth", function(req, res) {
		$("#getOauthModal").modal( "hide" );
		if ( req.query.token.length > 20 ) {
			settings.access_token = req.query.token;
			$("#getOauthField").val( req.query.token );
			getUsername();
			save();
		}
	} );
	app.listen( 3000 );

	$("#getOauthModal").modal("show");
	return false;
}


// https://github.com/nwjs/nw.js/wiki/Shell
function openLink(url){
	gui.Shell.openExternal(url);
}
