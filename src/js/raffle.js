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

var raffleSettings = {};
var raffleTimeout = "";
var raffleEntrants = [];

function raffleSetup() {
	$("#raffleStart").click(startRaffle);
	$("#raffleStop").click(stopRaffle); // for now
	$("#raffleWinner").click(pickRaffle);

	// settings
	try {
		var readFile = fs.readFileSync( `${execPath}settings/raffleSettings.ini` );
		raffleSettings = $.parseJSON( readFile );
	} catch(e) { // if there isn't a raffleSettings.ini, just use the default settings
		raffleSettings = {
			announce: "on",
			startText: "Raffle starting, plz type %key% to enter! It will end in %time% minutes, good luck!",
			endText: "The raffle has ended!",
			winnerText: "The winrar is: %winner%",
			time: 5,
			keyword: "raffle"
		};
	}

	if ( raffleSettings.announce === "on" ) {
		$("#raffleAnnounceOn").attr( "checked", true );
		$("#raffleAnnounceOn").parent().addClass("active");
	} else if ( raffleSettings.announce === "ten" ) {
		$("#raffleAnnounceTen").attr( "checked", true );
		$("#raffleAnnounceTen").parent().addClass("active");
	} else {
		$("#raffleAnnounceOff").attr( "checked", true );
		$("#raffleAnnounceOff").parent().addClass("active");
	}

	// raffleAnnounce listener
	$("input[name='raffleAnnounceRadio']").change( function() {
		raffleSettings.announce = this.value;
		save();
	} );


	$("#raffleStartText").val(raffleSettings.startText);
	$("#raffleStartText").change( function() {
		raffleSettings.startText = $("#raffleStartText").val();
		save();
	} );

	$("#raffleEndText").val(raffleSettings.endText);
	$("#raffleEndText").change( function() {
		raffleSettings.endText = $("#raffleEndText").val();
		save();
	} );

	$("#raffleWinnerText").val(raffleSettings.winnerText);
	$("#raffleWinnerText").change( function() {
		raffleSettings.winnerText = $("#raffleWinnerText").val();
		save();
	} );

	$("#raffleTime").val(raffleSettings.time);
	$("#raffleTime").on( "input", function() {
		raffleSettings.time = $("#raffleTime").val();
		save();
	} );

	$("#raffleKeyword").val(raffleSettings.keyword);
	$("#raffleKeyword").on( "input", function() {
		raffleSettings.keyword = $("#raffleKeyword").val();
		save();
	} );

}

function startRaffle() {
	if ( $("#raffleKeyword").val() == "" ) {
		$("#raffleStatus").html( "Please enter a keyword so people can enter!" );
		return ;
	}
	if ( $("#raffleTime").val() == "" ) {
		$("#raffleStatus").html( "Please choose the time the raffle will run!" );
		// fail, give error on why it doesn't work
		return ;
	}

	// Clear the entrants and rafflelist
	raffleEntrants = [];
	$("#raffleList").html("");

	// Say the start text
	var output = $("#raffleStartText").val();
	output = output.replace( /%key%/g, "!" + $("#raffleKeyword").val() );
	output = output.replace( /%time%/g, $("#raffleTime").val() );
	cmdSay( output );

	// insert the keyword into the command list #raffleKeyword

	// set a timeout for stopraffle
	raffleTimeout = setTimeout(stopRaffle, $("#raffleTime").val() * 60 * 1000);
	$("#raffleStatus").html( `Raffle started! Ending in ${$("#raffleTime").val()} minutes.`);
}

function stopRaffle() {
	if ( raffleTimeout === "" ){
		$("#raffleStatus").html( "No raffle is currently running." );
		return ;
	}

	clearTimeout( raffleTimeout );
	raffleTimeout = "";
	cmdSay( $("#raffleEndText").val() );

	$("#raffleStatus").html( "Raffle ended!" );
}

function pickRaffle() {
	clearTimeout( raffleTimeout );
	raffleTimeout = "";

	if ( raffleEntrants.length == 0 ) {
		$("#raffleStatus").html( `No entrants.` );
		return;
	}

	var winner = raffleEntrants[ Math.floor( Math.random() * raffleEntrants.length ) ];

	$("#raffleStatus").html( `WINNER: ${winner}` );

	if ( raffleSettings.announce === "on" ) {
		winnerText( winner );
	} else if ( raffleSettings.announce === "ten" ) {
		setTimeout( function() {
			winnerText(winner);
		}, 10*1000 );
	} // else if it's "off", do nothing
}

function winnerText( winner ) {
	var output = $("#raffleWinnerText").val();
	output = output.replace(/%winner%/g, winner);
	cmdSay(output);
}

function addToRaffle( username ) {
	// if the raffle is not running
	if ( raffleTimeout === "" ) {
		return ;
	}

	// already in the raffle
	if ( raffleEntrants.indexOf( username ) != -1 ) {
		return ;
	}

	raffleEntrants.push( username );
	$("#raffleList").append( `${username}<br>` );
}
