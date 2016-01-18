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

var raffleTimeout = "";
var raffleEntrants = [];
var raffleAnnounceRadio = "on";

function raffleSetup() {
	$("#raffleStart").button().click(startRaffle);
	$("#raffleStop").button().click(stopRaffle); // for now
	$("#raffleWinner").button().click(pickRaffle);
	$("#raffleAnnounceSet").buttonset();

	$("#raffleAnnounceOn").attr( "checked", true );
	$("#raffleAnnounceSet").buttonset( "refresh" );

	// linkPro button click listener
	$("#raffleAnnounceSet input[type=radio]").change( function() {
		raffleAnnounceRadio = this.value;
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
	$("#raffleStatus").html( "Raffle started! Ending in " + $("#raffleTime").val() + " minutes.");
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

	var winner = raffleEntrants[ Math.floor( Math.random() * raffleEntrants.length ) ];

	$("#raffleStatus").html( "WINNER: " + winner );

	if ( raffleAnnounceRadio === "on" ) {
		winnerText( winner );
	} else if ( raffleAnnounceRadio === "ten" ) {
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
	$("#raffleList").append( username + "<br>" );
}