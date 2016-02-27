// static commands

var defaultCommands = [];

function addStaticCommands() {
	try {
		var readFile = fs.readFileSync( `${execPath}settings/defaultCommands.ini` );
		defaultCommands = $.parseJSON( readFile );
	} catch(e) { // if there isn't a modSettings.ini, just use the default settings
		defaultCommands = createDefaultCommands();
	}

	var output = `<table class="table table-striped table-hover table-condensed">
		<tr>
			<th class="col-sm-2">Command</th>
			<th class="col-sm-3">Access</th>
			<th class="col-sm-7">Description</th>
		</tr>`;
	for ( var i = 0; i < defaultCommands.length; i++ ) {
		cmdList.push( {cmd: defaultCommands[i].cmd, func: defaultCommands[i].func, rbac: defaultCommands[i].rbac} );
		var rbac = defaultCommands[i].rbac;
		var cmd = defaultCommands[i].cmd;
		output += `<tr>
			<td>${cmdSettings.symbol}${cmd}</td>
			<td>
				<select class="form-control input-sm" id="cmdRBAC_${cmd}" onchange="changeRBAC('${cmd}')">
					<option value="off" ${(rbac=='off')?'selected="selected"':''}>Off</option>
					<option value="all" ${(rbac=='all')?'selected="selected"':''}>All users</option>
					<option value="reg" ${(rbac=='reg')?'selected="selected"':''}>Regulars, Subs, Mods</option>
					<option value="sub" ${(rbac=='sub')?'selected="selected"':''}>Subscribers & Mods</option>
					<option value="mod" ${(rbac=='mod')?'selected="selected"':''}>Moderators</option>
					<option value="bot" ${(rbac=='bot')?'selected="selected"':''}>Streamer (and bot) only</option>
				</select>
			</td>
			<td>${defaultCommands[i].desc}</td>
		</tr>`;
	}
	output += `</table>`;

	$("#commandsConfigPanel").append(output);
}

function changeRBAC(cmd) {
	var selector = `#cmdRBAC_${cmd}`;
	var newRBAC = $(selector).val();

	for (var i in defaultCommands) {
		if ( defaultCommands[i].cmd == cmd ) {
			defaultCommands[i].rbac = newRBAC;
		}
	}
	for (var i in cmdList) {
		if ( cmdList[i].cmd == cmd ) {
			cmdList[i].rbac = newRBAC;
		}
	}
}

function createDefaultCommands() {

	var cmds = [];

	cmds.push(
		{ cmd: "bottime", func: "cmdBotTime", rbac: "all", desc: "Displays the time the bot has been open." },
		{ cmd: "streamtime", func: "cmdStreamTime", rbac: "all", desc: "Displays the time the stream has been live." },
		{ cmd: "laptime", func: "cmdLapTime", rbac: "all", desc: "Displays the lap time." },
		{ cmd: "uptime", func: "cmdUpTime", rbac: "all", desc: "Displays the uptime." },
		{ cmd: "highlight", func: "cmdHighlight", rbac: "mod", desc: "Records the timestamp for future stream highlights." },
		{ cmd: "ht", func: "cmdHighlight", rbac: "mod", desc: "Records the timestamp for future stream highlights." },
		{ cmd: "bot", func: "cmdBot", rbac: "all", desc: "Displays the bot's author's info and link." },
		{ cmd: "game", func: "cmdGame", rbac: "mod", desc: "Changes the game played as shown on Twitch." },
		{ cmd: "status", func: "cmdStatus", rbac: "mod", desc: "Changes the stream status as shown on Twitch." },
		{ cmd: "addcmd", func: "cmdAddCmd", rbac: "mod", desc: "Adds a custom command." },
		{ cmd: "addcom", func: "cmdAddCmd", rbac: "mod", desc: "Adds a custom command." },
		{ cmd: "delcmd", func: "cmdDelCmd", rbac: "mod", desc: "Deletes a custom command." },
		{ cmd: "delcom", func: "cmdDelCmd", rbac: "mod", desc: "Deletes a custom command." }
	);

	// quotes
	cmds.push(
		{ cmd: "quote", func: "cmdQuote", rbac: "all", desc: "Displays a quote." },
		{ cmd: "addquote", func: "cmdAddQuote", rbac: "all", desc: "Adds a quote." },
		{ cmd: "delquote", func: "cmdDelQuote", rbac: "mod", desc: "Deletes a quote." }
	);

	// moderation
	cmds.push(
		{ cmd: "permit", func: "cmdPermit", rbac: "mod", desc: "Permits a user to post a link for 60 seconds." }
	);

	// songs
	cmds.push(
        { cmd: "currentsong", func: "cmdGetSong", rbac: "all", desc: "Displays the current song title." },
        { cmd: "skipsong", func: "cmdSkipSong", rbac: "mod", desc: "Skips the song being played." },
        { cmd: "volume", func: "cmdSetVolume", rbac: "mod", desc: "Changes the volume of the song." },
        { cmd: "mute", func: "cmdMute", rbac: "mod", desc: "Mutes the song." },
        { cmd: "songrequest", func: "cmdAddSong", rbac: "all", desc: "Adds a song to the queue." }
    );

	// points
	cmds.push(
		{ cmd: "points", func: "cmdPoints", rbac: "all", desc: "Displays the user's points." }
	);

	return cmds;
}

/*
function cmd ( params, from, mod, subscriber ) {

}
*/

function cmdBot( params, from ) {
	cmdSay( `This is ${title}. It is being developed by skhmt. Get it at: https://github.com/Skhmt/twitch-bot` );
}

function cmdHighlight( params, from ) {

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
			var text = params.join(" ");
			if ( text.length > 1 ) {
				output += ` ( ${text} )`;
			}
			output += "\r\n";

			fs.appendFile( `${execPath}logs/highlights.log`, output, function(err) {
				if (err) log( "* Error writing to highlights" );
			} );
		}
	);
}

function cmdUpTime( params, from ) {
	if ( cmdSettings.uptime === "bot" ) {
		cmdSay( `Uptime: ${timeDifference( startDate.getTime() )}` );
	} else if ( cmdSettings.uptime === "stream" ) {
		cmdStreamTime( params, from );
	} else {
		cmdSay( `Uptime: ${timeDifference( lap.getTime() )}` );
	}
}

function cmdLapTime( params, from ) {
	cmdSay( `The current lap time is ${timeDifference( lap.getTime() )}` );
}

function cmdStreamTime( params, from ) {
	// {"stream":null,"_links":{"self":"https://api.twitch.tv/kraken/streams/skhmt","channel":"https://api.twitch.tv/kraken/channels/skhmt"}}
	//
	$.getJSON(
		`https://api.twitch.tv/kraken/streams/${settings.channel.substring(1)}`,
		{
			"client_id" : clientid,
			"api_version" : 3
		},
		function(response) {
			console.log(response);
			if ( response.stream == null ) {
				return cmdSay( 'Stream offline.' );
			}
			var created = response.stream.created_at; // ex: "2015-12-03T20:39:04Z"
			var temp = new Date( created );
			var timediff = timeDifference( temp );
			cmdSay( `The stream has been live for ${timediff}` );
	} );
}


function cmdBotTime( params, from ) {
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


function changeGame( params, from ) {
	var game = params.join(" ");

	$.get(
		`https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}`,
		{
			"channel[game]": game,
			"_method": "put",
			"oauth_token": settings.access_token.substring(6)
		}
	);

	cmdSay( `${from} has changed the stream game to: ${game}` );
	$("#gameField").val( game );

	$("title").html(`${$("#statusField").val()} &mdash; ${game} &mdash; ${title}`);
}

function changeStatus( params, from ) {
	var status = params.join(" ");

	$.get(
		`https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}`,
		{
			"channel[status]":status,
			"_method": "put",
			"oauth_token": settings.access_token.substring(6)
		}
	);

	cmdSay( `${from} has changed the stream status to: ${status}` );
	$("#statusField").val( status );

	$("title").html(`${status} &mdash; ${$("#gameField").val()} &mdash; ${title}`);
}
