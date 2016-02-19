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


function quoteSetup() {
	$("#addQuoteButton").click(function() {
		var who = $("#addQuoteAuthor").val();
		var date = $("#addQuoteDate").val();
		var message = $("#addQuoteText").val();

		$("#addQuoteAuthor").val("");
		$("#addQuoteDate").val("");
		$("#addQuoteText").val("");

		addQuote(message, who, date);
		return false;
	} );
}

//cmdSettings.quotes[{active: true, message:"", who:"", date:""},...]
function cmdQuote( params, from ) {

	var tempIndex = params[0];

	// get an array of quotes that are enabled
	var activeQuotes = [];
	for ( var i = 0; i < cmdSettings.quotes.length; i++ ) {
		if ( cmdSettings.quotes[i].active ) {
			activeQuotes.push( cmdSettings.quotes[i] );
		}
	}

	if ( activeQuotes.length === 0 ) {
		return cmdSay( "No quotes in database." );
	}


	if ( !tempIndex ) {
		var randIndex = Math.floor( Math.random() * activeQuotes.length );
		var tempQuote = activeQuotes[randIndex];
		return cmdSay( `"${tempQuote.message}" - ${tempQuote.who}, ${tempQuote.date}` );
	}
	else if ( tempIndex == parseInt(tempIndex, 10) && // if it's an integer
		tempIndex >= 0 && // if it's not negative
		tempIndex < cmdSettings.quotes.length ) { // if it's a valid id
			if ( cmdSettings.quotes[tempIndex].active ) {
				var tempQuote = cmdSettings.quotes[tempIndex];
				return cmdSay( `"${tempQuote.message}" - ${tempQuote.who}, ${tempQuote.date}` );
			}
	}

	return cmdSay( "Quote does not exist." );
}

function addQuote(message, who, date) {
	var tempQuote = {
		active: true,
		message: message,
		who: who,
		date: date
	};
	cmdSettings.quotes.push( tempQuote );
	refreshQuotes();
}

// !addquote [user] [quote...]
function cmdAddQuote( params, from ) {
	if ( params[0] == null || params[1] == null ) {
		return cmdSay( `Usage: ${cmdSettings.symbol}addquote [author] [quote]` ); // not enough params to make a quote... perhaps send an error message?
	}
	var tempQuote = {
		active: true,
		message: "",
		who: "",
		date: ""
	};
	tempQuote.who = params.shift();
	tempQuote.date = ( new Date().toDateString() ).substring(4);
	tempQuote.message = params.join(" ");

	cmdSay( `"${tempQuote.message}" - <em>${tempQuote.who}</em> added to id: ${cmdSettings.quotes.push( tempQuote )-1}` );

	refreshQuotes();
}

// just setting to false, not actually deleting so the numbering doesn't change
function cmdDelQuote( params, from ) {
	var i = params[0];
	if ( i != parseInt(i, 10) ) {
		cmdSay( `Error, ${i} is not a number.` );
		return;
	}
	if ( i < 0 || i > cmdSettings.quotes.length ) {
		cmdSay( `Error, no such quote exists.` );
		return;
	}
	if ( cmdSettings.quotes[i].active == false ) {
		cmdSay( `Error, that quote has already been deleted.` );
		return;
	}

	cmdSettings.quotes[params[0]].active = false;
	cmdSay( `Quote at id: ${i} has been deleted.` );
	refreshQuotes();
}

function delQuoteButton( i ) {
	if ( confirm( `Are you sure you want to delete "${cmdSettings.quotes[i].message}" ?` ) ) {
		cmdSettings.quotes[i].active = false;
		refreshQuotes();
	}
}

function playQuoteButton( i ) {
	var tempQuote = cmdSettings.quotes[i];
	return cmdSay( `"${tempQuote.message}" - ${tempQuote.who}, ${tempQuote.date}` );
}

function refreshQuotes() {
	$("#quotes").html("");

	var output = `<table class="table table-striped table-hover table-condensed">`;

	for ( var i = 0; i < cmdSettings.quotes.length; i++ ) {
		if ( cmdSettings.quotes[i].active ) {
			output += `<tr>
				<td class="col-sm-2">
					<button onclick="playQuoteButton(${i})" class="btn btn-success btn-xs">
						<span class="glyphicon glyphicon-play"></span>
					</button>
					&nbsp;
					<button onclick="delQuoteButton(${i})" class="btn btn-danger btn-xs">
						<span class="glyphicon glyphicon-remove"></span>
					</button>
				</td>
				<td class="col-sm-10">
					<strong>${i} :</strong> &nbsp; &nbsp;
					"<i>${cmdSettings.quotes[i].message}</i>"
					- <b>${cmdSettings.quotes[i].who}</b>, ${cmdSettings.quotes[i].date}
				</td>
			</tr>`;
			// <button class="btn btn-warning btn-xs">
			// 	<span class="glyphicon glyphicon-pencil"></span>
			// </button>
			// &nbsp;
		}
	}
	output += `</table>`;
	$("#quotes").html( output );

}
