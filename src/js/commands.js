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
	commands.js is a library of functions that parse commands or deal with command logic.
*/

var cmdSettings = {};
var lap;
var cmdList = [];

function cmdSetup() {
	
	$("#addCmdButton").click(function() {
		addCmdButton();
		return false;
	} );

	$("#resetLap").click(function() {
		resetLap();
		return false;
	} );

	$("#updateGameButton").click(function() {
		changeGame( $("#gameField").val().split(" "), settings.username, true, true );
		return false;
	} );

	$("#updateStatusButton").click(function() {
		changeStatus( $("#statusField").val().split(" "), settings.username, true, true );
		return false;
	} );

	try {
		var readFile = fs.readFileSync( `${execPath}\\settings\\cmdSettings.ini` );
		cmdSettings = $.parseJSON( readFile );
	} catch(e) { // if there isn't a modSettings.ini, just use the default settings
		cmdSettings = {
			symbol : "!",
			custom : [], //{name, userType, text}
			quotes: [],
			uptime: "bot",
			songRequests: true
		};
	}
	
	// loading lap info
	try {
		var readFile = fs.readFileSync( `${execPath}\\logs\\lap.log`, "utf8" );
		lap = new Date( parseInt(readFile,10) );
		$("#lapTime").html( `${lap.toDateString()} ${lap.toLocaleTimeString()}` );
	} catch(e) { // if there isn't a modSettings.ini, just use the default settings
		resetLap();
	}

	// uptime buttons config
	if ( cmdSettings.uptime === "lap" ) {
		$("#uptimeRadioLap").prop("checked", true);
		$("#uptimeRadioLap").parent().addClass("active");
	} else if( cmdSettings.uptime === "stream" ) {
		$("#uptimeRadioStream").prop("checked", true);
		$("#uptimeRadioStream").parent().addClass("active");
	} else {
		$("#uptimeRadioBot").prop("checked", true);
		$("#uptimeRadioBot").parent().addClass("active");
	}

	// uptime radio listeners
	$("input[name='uptimeRadio']").change( function() {
		cmdSettings.uptime = this.value;
		save();
	} );


	addStaticCommands();

	refreshCommands();
	refreshQuotes();
}

/**
 * @param {string} text - the full text string, including cmdSymbol
 * @param {string} from - the user
 * @param {boolean} mod - true if the user is a moderator
 * @param {boolean} subscriber - true if the user is a subscriber
 */
function parseCommand(text, from, mod, subscriber) {

	if (!commandsOn) return;
	// there is an array cmdList: [ {cmd: "", func: ""}, ... ]
	// it has been constructed of static and custom commands
	// it can be added to by plugins

	var cmd = text.split(" ")[0].toLowerCase().substring(1); // the command minus the command symbol
	var params = text.split(" ");
	params.shift(); // an array of params

	for ( var i = 0; i < cmdList.length; i++ ) {
		if ( cmdList[i].cmd === cmd ) {
			//win.window[cmdList[i].func]( params, from, mod, subscriber );
			eval(`${cmdList[i].func}(${JSON.stringify(params)}, "${from}", ${mod}, ${subscriber})`);
			return;
		}
	}

	// Special cases... if it's the raffle keyword, check, otherwise treat as a custom command
	if ( cmd === $("#raffleKeyword").val() ) {
		addToRaffle( from );
	} else {
		customCommand( cmd, params, from, mod, subscriber);
	}
}

function refreshCommands() {
	// clear the commands div
	$("#commands").html("");
	
	// rewrite commands div
	for ( var i = 0; i < cmdSettings.custom.length; i++ ) {
		var output = `<button id='cmdDel${i}' onclick='delCmdButton(${i})'
			class='btn btn-primary btn-sm'><span class="glyphicon glyphicon-remove"></span></button>
			<span style='display: inline-block; width: 140px;'><b>${cmdSettings.symbol + cmdSettings.custom[i].name}</b></span>
			<span style='display: inline-block; width: 75px;'><i>`;

		if ( cmdSettings.custom[i].userType == "" ) output += "[All users]";
		else output += `[${cmdSettings.custom[i].userType}]`;
		output += `</i></span>${cmdSettings.custom[i].text}<br />`;
		
		$("#commands").append( output );
	}
}

// !addcom (-ul=userLevel) [!command]  [text]
// this is a chat function
function cmdAddCmd( params, from, mod, subscriber ) {
	if ( !mod ) return;

	if ( params[0] == null ) {
		return cmdSay( `Usage: ${cmdSettings.symbol}addcom (-ul=mod) [${cmdSettings.symbol}command] [text]` );
	}
	
	// check if it exists as a fixed command
	
	// check if it exists as a custom command
	
	var tempCommand = {
		name: "",
		userType: "",
		text: ""
	};
	
	if ( params[0].substring(0,4) === "-ul=" ) {
		var type = params[0].substring(4);
		if ( type === "mod" ) tempCommand.userType = "mod";
		else if ( type === "sub" ) tempCommand.userType = "sub";
		else if ( type === "streamer" ) tempCommand.userType = "streamer";
		params.splice(0,1); // removing !addcom -ul=*
	}
	
	if ( params[0] === null ) {
		return cmdSay( `Usage: ${cmdSettings.symbol}addcom (-ul=mod) [${cmdSettings.symbol}command] [text]` );
	}
	
	// get the command name
	if ( params[0].charAt(0) === cmdSettings.symbol ) { // store it without the symbol
		tempCommand.name = params[0].substring(1);
	} else {
		tempCommand.name = params[0];
	}
	tempCommand.name = tempCommand.name.toLowerCase(); // making it lower case
	
	params.splice(0,1); // remove the command name
	tempCommand.text = params.join(" ");

	cmdSettings.custom.push( tempCommand );
	cmdSay( `Adding command: ${tempCommand.name}, ul: ${tempCommand.userType}, text: ${tempCommand.text}` );
	save();
	refreshCommands();
}

function addCmdButton() {
	var tempName = $("#addCmdName").val();
	
	if ( tempName.charAt(0) === cmdSettings.symbol ) {
		tempName = tempName.substring(1);
	}
	
	var tempCommand = {
		name: tempName.toLowerCase(),
		userType: $("#addCmdUserType").val(),
		text: $("#addCmdText").val()
	};
	
	$("#addCmdName").val("");
	$("#addCmdText").val("");
	
	cmdSettings.custom.push( tempCommand );
	save();
	refreshCommands();
}

function cmdDelCmd( params, from, mod, subscriber ) {
	var cmdIndex = "";
	var lcCmd = params[0].toLowerCase();
	for ( var i = 0; i < cmdSettings.custom.length; i++ ) {
		// find the command
		var tempName = cmdSettings.symbol + cmdSettings.custom[i].name;
		if ( lcCmd === tempName ) {
			cmdIndex = i;
			break;
		}
	}
	if ( cmdIndex === "" ) return cmdSay( "Error, could not find command." ); //not a valid command
	
	cmdSettings.custom.splice( cmdIndex, 1 );
	cmdSay( `Deleted command: ${params[0]}` );
	save();
	refreshCommands();
}

function delCmdButton( id ) {
	if ( confirm( `Are you sure you want to delete ${cmdSettings.custom[id].name} ?` ) ) {
		cmdSettings.custom.splice( id, 1 );
		save();
		refreshCommands();
	}
}

// running a custom command
function customCommand( cmd, params, from, mod, subscriber ) {
	var cmdIndex = "";

	for ( var i = 0; i < cmdSettings.custom.length; i++ ) {
		// find the command
		var tempName = cmdSettings.custom[i].name;
		if ( cmd === tempName ) {
			cmdIndex = i;
			break;
		}
	}
	if ( cmdIndex === "" ) return; //not a valid command
	
	var isStreamer = ( from == settings.channel.substring(1) );
	var isBot = ( from == settings.username );

	// checking permissions
	if ( cmdSettings.custom[cmdIndex].userType === "mod" && !mod && !isStreamer && !isBot ) {
		return;
	}
	else if ( cmdSettings.custom[cmdIndex].userType === "sub" && !mod && !subscriber && !isStreamer && !isBot ) {
		return;
	}
	else if ( cmdSettings.custom[cmdIndex].userType === "streamer" && !isStreamer && !isBot ) {
		return; 
	}
	
	// Variables!

	var output = cmdSettings.custom[cmdIndex].text;
	output = output.replace(/%1%/g, params[0])
		.replace(/%2%/g, params[1])
		.replace(/%3%/g, params[2])
		.replace(/%4%/g, params[3])
		.replace(/%5%/g, params[4]);
	cmdSay(output);
}

function cmdSay( text ) {
	bot.say( settings.channel, text );
	log( `<b>[${cmdSettings.symbol}] ${text}</b>` );
}

