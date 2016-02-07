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

//timedMessages.js

var timedMessages = [];

function timedMessagesSetup() {
	
	try {
		var readFile = fs.readFileSync( `${execPath}settings/timedMessages.ini` );
		timedMessages = $.parseJSON( readFile );
	} catch(e) { // if there isn't a timedMessages.ini, just use the default settings
		timedMessages = [];
	}

	$("#addMsgButton").click( function() {
		addMessage();
		return false;
	} );
	
	refreshMessages();
}

function refreshMessages() {
	// clear the timedMsgs area
	$("#timedMsgs").html("");
	
	// clear the timerList
	timerList = [];
	
	for ( var i = 0; i < timedMessages.length; i++ ) {
		var output = "";
		// build a message... [X] [Time] [Message]
		output += `<button id='msg${i}' onclick='deleteMessage(${i})'
			class='btn btn-primary btn-sm'><span class="glyphicon glyphicon-remove"></span></button>
			<span class='timedMessageSpan'>${timedMessages[i].time}s</span> &nbsp; &nbsp; &nbsp;
			${timedMessages[i].text}<br> `;
		
		// add the message to the ui list of messages
		$("#timedMsgs").append( output );
		
		// create an interval
		//var intervalId = setInterval(playMessage(i), timedMessages[i].time * 1000);
		
		// add the message to timedMessagesIntervals
		var now = new Date().getTime();
		var tempInterval = timedMessages[i].time * 1000;
		timerList.push( {
			message: timedMessages[i].text,
			playTime: now + tempInterval,
			interval: tempInterval
		} );
	}
}

function addMessage() {
	// add the message
	var tempText = $("#addMsgText").val();
	var tempTime = $("#addMsgTime").val();
	
	if( tempText === "" ) {
		alert( "Error: no text entered." );
	} else if ( tempTime != parseInt( tempTime, 10 ) ) {
		alert( "Error: time should be a number." );
	} else if ( tempTime <= 0 ) {
		alert( "Error: time must be greater than 0 seconds." );
	} else {
		timedMessages.push( {
			text: tempText,
			time: tempTime
		} );
		save();
		
		// clear the fields
		$("#addMsgText").val("");
		$("#addMsgTime").val("120");
		
		refreshMessages();
	}
}

function deleteMessage( id ) {
	if ( confirm( `Are you sure you want to delete "${timedMessages[id].text}" ?` ) ) {
		timedMessages.splice( id, 1 );
		save();
		refreshMessages();
	}
}