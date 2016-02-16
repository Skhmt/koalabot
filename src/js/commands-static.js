// static commands

function addStaticCommands() {

	cmdList.push(
		// { cmd: "", func: "" },
		{ cmd: "bottime", func: "cmdBotTime" },
		{ cmd: "streamtime", func: "cmdStreamTime" },
		{ cmd: "laptime", func: "cmdLapTime" },
		{ cmd: "uptime", func: "cmdUpTime" },
		{ cmd: "highlight", func: "cmdHighlight" },
		{ cmd: "ht", func: "cmdHighlight" },
		{ cmd: "bot", func: "cmdBot" },
		{ cmd: "game", func: "cmdGame" },
		{ cmd: "status", func: "cmdStatus" },
		{ cmd: "addcmd", func: "cmdAddCmd" },
		{ cmd: "addcom", func: "cmdAddCmd" },
		{ cmd: "delcmd", func: "cmdDelCmd" },
		{ cmd: "delcom", func: "cmdDelCmd" }
	);

	// quotes
	cmdList.push(
		{ cmd: "quote", func: "cmdQuote" },
		{ cmd: "addquote", func: "cmdAddQuote" },
		{ cmd: "delquote", func: "cmdDelQuote" }
	);

	// moderation
	cmdList.push(
		{ cmd: "permit", func: "cmdPermit" }
	);

	// songs
	cmdList.push(
        { cmd: "currentsong", func: "cmdGetSong" },
        { cmd: "skipsong", func: "cmdSkipSong" },
        { cmd: "volume", func: "cmdSetVolume" },
        { cmd: "mute", func: "cmdMute" },
        { cmd: "songrequest", func: "cmdAddSong" }
    );

	// points
	cmdList.push(
		{ cmd: "points", func: "cmdPoints" });
}

/*
function cmd ( params, from, mod, subscriber ) {

}
*/

function cmdBot ( params, from, mod, subscriber ) {
	cmdSay( `This is KoalaBot. It is being developed by skhmt using NW.js.
		Get it at: https://github.com/Skhmt/twitch-bot` );
}

function cmdHighlight( params, from, mod, subscriber ) {
	if ( !mod ) return;

	// Get time the stream started
	$.getJSON(
		`https://api.twitch.tv/kraken/streams/${settings.channel.substring(1)}`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response) {
			if ( response.stream === null ) {
				return cmdSay( "Stream offline, cannot create highlight reminder" );
			}

			var created = response.stream.created_at; // ex: "2015-12-03T20:39:04Z"
			var temp = new Date( created );
			var highlight = timeDifference( temp.getTime() );

			cmdSay( `${from} highlighted ${highlight}.` );

			// write to log
			var dateNow = new Date();
			var output = `[${dateNow.toDateString()}, ${dateNow.toLocaleTimeString()}]`;
			output += ` ${from}: `;
			output += highlight;
			if ( text.length > 1 ) {
				output += " ( ";
				for ( var i = 1; i < text.length; i++ ){
					output += text[i] + " ";
				}
				output += ")";
			}
			output += "\r\n";

			fs.appendFile( `${execPath}logs/highlights.log`, output, function(err) {
				if (err) log( "* Error writing to highlights" );
			} );
		}
	);
}

function cmdUpTime ( params, from, mod, subscriber ) {
	if ( cmdSettings.uptime === "bot" ) {
		cmdSay( `Uptime: ${timeDifference( startDate.getTime() )}` );
	} else if ( cmdSettings.uptime === "stream" ) {
		cmdStreamTime( params, from, mod, subscriber );
	} else {
		cmdSay( `Uptime: ${timeDifference( lap.getTime() )}` );
	}
}

function cmdLapTime ( params, from, mod, subscriber ) {
	cmdSay( `The current lap time is ${timeDifference( lap.getTime() )}` );
}

function cmdStreamTime ( params, from, mod, subscriber ) {
	$.getJSON(
		`https://api.twitch.tv/kraken/streams/${settings.channel.substring(1)}`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response) {
			if ( "error" in response ) {
				return cmdSay(error);
			}
			var created = response.stream.created_at; // ex: "2015-12-03T20:39:04Z"
			var temp = new Date( created );
			var timediff = timeDifference ( temp );
			cmdSay( `The stream has been live for ${timediff}` );
	} );
}


function cmdBotTime ( params, from, mod, subscriber ) {
	cmdSay( `The bot has been running for ${timeDifference( startDate.getTime() )}` );
}




// takes a time in miliseconds since Jan 1 1970 and returns the difference between then and now as a string
function timeDifference(oldtime) {

	var dt = new Date();
	var difftime = Math.floor( ( dt.getTime() - oldtime ) / 1000);
	var diffHrs = Math.floor( difftime / 3600 ); //3600 = 60*60 = seconds per hour
	var diffMins = Math.floor( (difftime % 3600) / 60);
	var diffSecs = difftime - (diffHrs * 3600) - (diffMins * 60);

	var output = "";

	if ( diffHrs === 1 ) output += diffHrs + " hour, ";
	else if ( diffHrs > 1 ) output += diffHrs + " hours, ";

	if ( diffMins === 1 ) output += diffMins + " minute, ";
	else if ( diffMins > 1 ) output += diffMins + " minutes, ";

	if ( diffSecs === 1 ) output += diffSecs + " second";
	else output += diffSecs + " seconds";

	return output;
}

function resetLap() {
	lap = new Date();

	fs.writeFile( `${execPath}logs/lap.log`, lap.getTime(), function(err) {
		if (err) log( "* Error saving lap time" );
	} );

	$("#lapTime").html( `${lap.toDateString()} ${lap.toLocaleTimeString()}` );
}

// https://github.com/justintv/Twitch-API/blob/master/v3_resources/follows.md#get-usersuserfollowschannelstarget
// ex of non-follower: {"error":"Not Found","status":404,"message":"skhmt is not following lirik"}
function isFollower( from ) {
	$.getJSON(
		`https://api.twitch.tv/kraken/users/${from}/follows/channels/${settings.channel.substring(1)}`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response){
			cmdSay( `${from} is a follower.` );
			/* ex of created_at: "2015-12-03T20:39:04+00:00"
				not doing anything with this for now
			 */
			// var followedTime = response.created_at;
		}
	).error(function() {
		cmdSay( `${from} is not a follower.` );
	} );
}
