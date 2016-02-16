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

	var output = `<table class="table table-striped table-hover table-condensed">`;

	for ( var i = 0; i < timedMessages.length; i++ ) {
		// build a message... [X] [Time] [Message]
		output += `<tr>
			<td class="col-sm-2">
				<button onclick='playMessage(${i})' class='btn btn-success btn-xs'>
					<span class="glyphicon glyphicon-play"></span>
				</button>
				&nbsp;
				<button onclick='deleteMessage(${i})' class='btn btn-danger btn-xs'>
					<span class="glyphicon glyphicon-remove"></span>
				</button>
			</td>
			<td class="col-sm-1">
				<span class='timedMessageSpan'>${timedMessages[i].time}s</span>
			</td>
			<td class="col-sm-9">
				${timedMessages[i].text}
			</td>
		</tr>`;

		// add the message to timedMessagesIntervals
		var now = new Date().getTime();
		var tempInterval = timedMessages[i].time * 1000;
		timerList.push( {
			message: timedMessages[i].text,
			playTime: now + tempInterval,
			interval: tempInterval
		} );
	}
	output += `</table>`;
	$("#timedMsgs").html( output );
}

function playMessage(i) {
	cmdSay( timedMessages[i].text );
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
