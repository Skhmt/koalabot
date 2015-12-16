

/* vars */
var clientid = "idc20bfbuv46327tp8jgc6qhznewz9"; /* this is the (public) client_id of StreamKoala. */
var bot;
var server = "irc.twitch.tv";
var fs;
var logFile;
var execPath;
var hosts = [];
var hostFile;
var viewers = [];
var hostTimer;
var userListTimer;
var startDate = new Date();
var subBadgeUrl = "";
var permitted = [];
var modSettings;
var emoticonsTwitch = [];
var emoticonsBTTV = [];
var emoticonsBTTVall = [];

var settings = {
	access_token: "",
	username: "",
	channel: ""
};


$(document).ready(function(){
	
	// Setting up jQuery elements
	var gui = require("nw.gui")
	var win = gui.Window.get();

	
	$("#tabs").tabs();
	
	$("#getOauthDialog").dialog({
		autoOpen: false,
		modal: true,
		height: 580,
		width: 700	
	});
	
	$("#graphDialog").dialog({
		autoOpen: false,
		modal: true,
		height: 580,
		width: 750	
	});

	$("#getOauthLink").button().click(function(){
		$("#getOauthDialog").dialog("open");
	});

	$("#saveOauth").button().click(function(){
		var newoauth = $("#getOauthField").val();
		if( settings.access_token != newoauth ){ // if you're changing user
			settings.access_token = newoauth;
			getUsername();
		}
	});

	$("#changeChannel").button().click(function(){
		var newchan = $("#getChannelField").val();
		if ( newchan.substring(0,1) != "#" ){ // if the user forgot the #, add it
			newchan = "#"+newchan;
			$("#getChannelField").val(newchan);
		}

		if ( newchan != settings.channel ){ // if the channel is actually different
			bot.part(settings.channel, function(){
				log("* Parting " + settings.channel);
			});
			bot.join(newchan, function(){
				log("* Joining " + newchan);
				settings.channel = newchan;
				runHU();
			});
		}
	});
	
	// window control jQuery elements
	$("#exit").button({
		text: false,
		icons: {
			primary: "ui-icon-close"
		}
	}).click(function(event){
		win.close();
	});
	$("#minimize").button({
		text: false,
		icons: {
			primary: "ui-icon-minusthick"
		}
	}).click(function(event){
		win.minimize();
	});
	$("#maximize").button({
		text: false,
		icons: {
			primary: "ui-icon-arrowthick-1-ne"
		}
	}).click(function(event){
		var options;
		if ( $( this ).text() === "maximize" ) {
			options = {
				label: "unmaximize",
				icons: {
					primary: "ui-icon-arrowthick-1-sw"
				}
			};
			win.maximize();
		} else {
			options = {
				label: "maximize",
				icons: {
					primary: "ui-icon-arrowthick-1-ne"
				}
			};
			win.unmaximize();
		}
		$( this ).button( "option", options );
	});

	// Setting up file read stuff and variables
	fs = require("fs");
	var path = require("path");
	
	execPath = path.dirname(process.execPath);
	
	// making logs and settings directories
	try{ fs.accessSync(execPath+"\\logs"); }
	catch (e) { fs.mkdirSync(execPath+"\\logs"); }
	
	try{ fs.accessSync(execPath+"\\settings"); }
	catch (e) { fs.mkdirSync(execPath+"\\settings"); }
	
	
	hostFile = execPath + "\\logs\\hosts.log";

	// Setting up the chat log
	var d = new Date();
	var dmonth = d.getMonth() < 10 ? "0" + d.getMonth() : d.getMonth();
	var dday = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
	var dhour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
	var dmin = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
	var dsec = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
	var logname = "chatlog_" + d.getFullYear() + "-" + dmonth + "-" + dday + "_" + dhour + "-" + dmin + "-" + dsec + ".log";
	logFile = execPath + "\\logs\\" + logname;
	
	// setting up moderation area
	modSetup();
	
	// setting up the commands area
	cmdSetup();
	
	// getting twitch and bttv emoticons
	getEmoticons();
	
	// setting up timed messages
	timedMessagesSetup();
	
	// starting the timer
	timerSetup();
	
	// setting up stats stuff
	statsSetup();
	
	// loading settings.ini
	try {
		var readFile = fs.readFileSync(execPath + "\\settings\\settings.ini");
		settings = $.parseJSON( readFile );

		// Setting up config area
		$("#getOauthField").val(settings.access_token);
		$("#getChannelField").val(settings.channel);
		$("#displayName").html(settings.username);

		// Running tabs
		runChat();
		runHU();
	} catch (e) {
		$("#getOauthField").val("");
	}
});

function getUsername() {
	var token = settings.access_token.substring(6);
	$.getJSON(
		"https://api.twitch.tv/kraken",
		{
			"client_id" : clientid,
			"api_version" : 3,
			"oauth_token" : token	
		},
		function(response){
			settings.username = response.token.user_name;
			$("#displayName").html(settings.username);
			
			settings.channel = "#"+settings.username;
			$("#getChannelField").val(settings.channel);

			save();	
			runChat();
			runHU();
		}
	);
}


function runChat() {
	
	try {
		bot.disconnect(function(){
			log("* Disconnected from " + server);
		});
	} catch (e) {}

	var irc = require("irc");
	
	var config = {
		//channels: [settings.channel],
		server: server,
		username: settings.username,
		nick: settings.username,
		password: settings.access_token,
		sasl: true,
		autoConnect: false
	};

	bot = new irc.Client(config.server, config.nick, config);

	bot.connect(5, function(){
		log("* Connected to " + server);
	});
	
	bot.addListener("registered", function(message){
		bot.send("CAP REQ", "twitch.tv/membership");
		bot.send("CAP REQ", "twitch.tv/commands");
		bot.send("CAP REQ", "twitch.tv/tags")
		bot.join(settings.channel, function(){
			log("* Joining " + settings.channel);
		});
	});
	
	bot.addListener("error", function(message){
		log("* Error: " + message);
	});
	
	bot.addListener("raw", function(message){
		var args = message.args[0].split(" ");
		var command = message.command;
		
		if (false){ // logging all raw commands
			log("<b>" + message.rawCommand + "</b>");
			log(" args: " + args);
		}
		
		parseMsg(command, args);
	});
}

// This is run every time a channel is entered
function runHU() {
	// clearing the timers
	clearInterval(hostTimer);
	clearInterval(userListTimer);

	// clearing the host file, hosts tab, and the list of hosts
	fs.writeFileSync(hostFile, "");
	$("#hosts").html("");
	hosts = [];
	
	// get BTTV emotes
	getEmoticonsBTTV();
	
	// get subscriber image URL of the channel you're in
	$.getJSON(
		"https://api.twitch.tv/kraken/chat/"+ settings.channel.substring(1) +"/badges",
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response){
			if (response.subscriber != null) {
				subBadgeUrl = response.subscriber.image;
			}
		}
	);
	
	// get id of the channel you're in and current game and stream title
	$.getJSON(
		"https://api.twitch.tv/kraken/channels/" + settings.channel.substring(1),
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response){
			settings.id = response._id;
			save();
			$("#gameField").val(response.game);
			$("#statusField").val(response.status);
		}
	);
}

function updateHosts() {
	// get hosts into json
	$.getJSON(
		"http://tmi.twitch.tv/hosts",
		{
			"include_logins" : "1",
			"target" : settings.id
		},
		function(response){
			// make an array of current hosts
			for (var i = 0; i < response.hosts.length; i++){
				var tempHost = response.hosts[i].host_login;
				if( hosts.indexOf(tempHost) == -1 ){ // if the host is not in the current list of hosts
					// add to the list of hosts to prevent duplication in the future
					hosts.push(tempHost);

					// add to the hosts tab
					$("#hosts").append(getTimeStamp() + " Host: " + tempHost + "<br>"); 

					// log the host
					log("* " + getTimeStamp() + " " + tempHost + " is hosting " + settings.channel);

					// write to host file
					fs.appendFile(hostFile, tempHost + "\r\n", function (err) {
						if (err) log("* Error writing to host file");
					});
				}
			}
		}
	);
}

function updateUserlist() {
	$.getJSON(
		"https://tmi.twitch.tv/group/user/" + settings.channel.substring(1) + "/chatters",
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response){
			
			if (response.chatters == null) return; // didn't load a user yet
			
			var output = "<b>Total viewers</b>: " + response.chatter_count + "<br>"; 
			
			exportViewers(response.chatter_count);
			
			var staffLen = response.chatters.staff.length;
			if (staffLen > 0) {
				output += "<p> <b>STAFF (" + staffLen + ")</b> <br> ";
				for (var i = 0; i < staffLen; i++) {
					output += response.chatters.staff[i] + " <br> ";
				}
				output += "</p> ";
			}

			var modLen = response.chatters.moderators.length;
			if (modLen > 0) {
				output += "<p> <b>MODERATORS (" + modLen + ")</b> <br> ";
				for (var i = 0; i < modLen; i++) {
					output += response.chatters.moderators[i] + " <br> ";
				}
				output += "</p> ";
			}

			var adminLen = response.chatters.admins.length;
			if (adminLen > 0) {
				output += "<p> <b>ADMINS (" + adminLen + ")</b> <br> ";
				for (var i = 0; i < adminLen; i++) {
					output += response.chatters.admins[i] + " <br> ";
				}
				output += "</p> ";
			}

			var globalLen = response.chatters.global_mods.length;
			if (globalLen > 0) {
				output += "<p> <b>GLOBAL MODS (" + globalLen + ")</b> <br> ";
				for (var i = 0; i < globalLen; i++) {
					output += response.chatters.global_mods[i] + " <br> ";
				}
				output += "</p> ";
			}

			var viewLen = response.chatters.viewers.length;
			if (viewLen > 0) {
				output += "<p> <b>VIEWERS (" + viewLen + ")</b> <br> ";
				for (var i = 0; i < viewLen; i++) {
					output += response.chatters.viewers[i] + " <br> ";
				}
				output += "</p> ";
			}

			$("#userlist").html(output);
		}
	);
}

/*
emoticons: [{
        "regex": "ydmSatti",
        "images": [{
            "width": 28,
            "height": 28,
            "url": "http://static-cdn.jtvnw.net/jtv_user_pictures/emoticon-69119-src-0d4b23ce12767ed8-28x28.png",
            "emoticon_set": 13794
        }]
    }, {
        "regex": "cmvChanManV",
        "images": [{
            "width": 23,
            "height": 30,
            "url": "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-000c3b4a9a1df310-23x30.png",
            "emoticon_set": 73
        }]
    }, ... ];
*/
function getEmoticons(){
	$.getJSON(
		"https://api.twitch.tv/kraken/chat/emoticons",
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response){
			emoticonsTwitch = response.emoticons;
		}
	);
}

/*
	{
		"status": 200,
		"urlTemplate": "//cdn.betterttv.net/emote/{{id}}/{{image}}",
		"bots": [],
		"emotes": [{
			"id": "56277337a6646e202bcc4f63",
			"channel": "CoolidgeHD",
			"code": "coolBoop",
			"imageType": "png"
		}, {
			"id": "5627f573a6646e202bcc500b",
			"channel": "CoolidgeHD",
			"code": "coolCool",
			"imageType": "png"
		}, {
			"id": "56277387a6646e202bcc4f69",
			"channel": "CoolidgeHD",
			"code": "coolMofo",
			"imageType": "png"
		}]
	}
*/
function getEmoticonsBTTV(){
	$.getJSON(
		"https://api.betterttv.net/2/channels/" + settings.channel.substring(1),
		{
			
		},
		function(response){
			emoticonsBTTV = response.emotes;
		}
	);

	$.getJSON(
		"https://api.betterttv.net/emotes",
		{

		},
		function(response){
			emoticonsBTTVall = response.emotes;
		}
	)
}

function writeEmoticons(message){
	var output = "";
	var text = message.split(" ");
	
	// for each word, check if it's an emoticon and if it is, output the url instead of the text
	for (var i = 0; i < text.length; i++) {
		var tempword = text[i];
		
		var found = false;
		// checking BTTV channel specific emotes first since it's smaller
		for(var j = 0; j < emoticonsBTTV.length; j++) {
			if (tempword == emoticonsBTTV[j].code){
				output += "<img src='https://cdn.betterttv.net/emote/" + emoticonsBTTV[j].id + "/1x' class='emoticon'> ";
				found = true;
				break;
			}
		}

		if(!found) {
			// checking universal BTTV emotes
			for(var j = 0; j < emoticonsBTTVall.length; j++) {
				if (tempword == emoticonsBTTVall[j].regex){
					output += "<img src='https:" + emoticonsBTTVall[j].url + "' class='emoticon'> ";
					found = true;
					break;
				}
			}
		}
		
		if(!found) {
			// checking official Twitch emotes
			for(var j = 0; j < emoticonsTwitch.length; j++) {
				if (tempword == emoticonsTwitch[j].regex){
					output += "<img src='" + emoticonsTwitch[j].images[0].url + "' class='emoticon'> ";
					found = true;
					break;
				}
			}
		}
		
		if (!found) output += tempword + " ";
	}
	
	return output;
}

function log(message) {
	var out = document.getElementById("console");
	
	/* 
		scrollHeight = element's total height including overflow
		clientHeight = element's height including padding excluding horizontal scroll bar
		scrollTop = distance from an element's top to its topmost visible content, it's 0 if there's no scrolling needed
		allow 1px inaccuracy by adding 1
	*/
	var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 5;
	
	$("#console").append(writeEmoticons(message) + "<br>");
	
	if(isScrolledToBottom) out.scrollTop = out.scrollHeight - out.clientHeight;

	// remove html tags before writing to the log
	var wrapped = $("<div>" + message + "</div>");
	message = wrapped.text();

	// write to log
	fs.appendFile(logFile, message + "\r\n", function (err) {
		if (err) $("#console").append("* Error writing to log" + "<br>");
	});
}

function chat() {
	// get the chat input box value
	var text = $("#chatText").val();
	
	// output it to the console
	log(getTimeStamp() + " <b>&gt;</b> " + text);
	
	// check if it was a command...
	if (text.substring(0,1) == cmds.symbol){
		parseCommand(text, settings.username, "mod", true);
	} 
	else {
		// send the data to the irc server
		bot.say(settings.channel, text);
	}
	
	// clear the chat input box
	$("#chatText").val("");
}

function getTimeStamp() {
	var dt = new Date();
	var hrs = dt.getHours();
	var mins = dt.getMinutes();
	var secs = dt.getSeconds();
	
	if (hrs < 10) hrs = "0" + hrs;
	if (mins < 10) mins = "0" + mins;
	if (secs < 10) secs = "0" + secs;
	
	return "[" + hrs + ":" + mins + "]";
}

function save(){
	// saving settings.ini
	fs.writeFile(execPath + "\\settings\\settings.ini", JSON.stringify(settings), function (err) {
		if (err) log("* Error saving settings");
	});
	
	// saving modSettings.ini
	fs.writeFile(execPath + "\\settings\\modSettings.ini", JSON.stringify(modSettings), function (err) {
		if (err) log("* Error saving modSettings");
	});
	
	// saving timedMessages.ini
	fs.writeFile(execPath + "\\settings\\timedMessages.ini", JSON.stringify(timedMessages), function (err) {
		if (err) log("* Error saving timedMessages");
	});
	
	// saving cmdSettings.ini
	fs.writeFile(execPath + "\\settings\\cmdSettings.ini", JSON.stringify(cmds), function (err) {
		if (err) log("* Error saving cmdSettings");
	});
}