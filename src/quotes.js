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


//cmds.quotes[{active: true, message:"", who:"", date:""},...]
function quote( cmd ) {
	
	// get an array of quotes that are enabled
	var activeQuotes = [];
	for ( var i = 0; i < cmds.quotes.length; i++ ) {
		if ( cmds.quotes[i].active ) {
			activeQuotes.push( cmds.quotes[i] );
		}
	}
	
	if( activeQuotes == null ) {
		return cmdSay( "No quotes in database." );
	}
	
	var theindex;
	
	if ( cmd[1] == null ) {
		theindex = Math.floor( Math.random() * activeQuotes.length );
	}
	else if ( cmd[1] == parseInt(cmd[1], 10) && // if it's an integer
		cmd[1] >= 0 && // if it's not negative
		cmd[1] < activeQuotes.length ) { // if it's a valid id
			theindex = cmd[1];
	} else {
		return cmdSay( "Quote does not exist." );
	}
	var tempQuote = activeQuotes[theindex];
	cmdSay( `"${tempQuote.message}" - ${tempQuote.who}, ${tempQuote.date}` );
}

// !addquote [user] [quote...]
function addQuote( cmd ) {
	if ( cmd[1] == null || cmd[2] == null ) {
		return cmdSay( `Usage: ${cmds.symbol}addquote [author] [quote]` ); // not enough params to make a quote... perhaps send an error message?
	}
	var tempQuote = {
		active: true,
		message: "",
		who: "",
		date: ""
	};
	tempQuote.who = cmd[1];
	tempQuote.date = ( new Date().toDateString() ).substring(4);
	
	var tempMessage = cmd;
	tempMessage.splice(0,2); // removing !addquote and the "who"

	
	tempQuote.message = tempMessage.join(" ");
	
	cmdSay( `Quote added at id:${cmds.quotes.push( tempQuote ) - 1}` );
	
	save();
	refreshQuotes();
}

// just setting to false, not actually deleting so the numbering doesn't change
function delQuote( cmd ) {
	var i = cmd[1];
	if ( i != parseInt(i, 10) ) {
		cmdSay( `Error, ${i} is not a number.` );
		return;
	}
	if ( i < 0 || i > cmds.quotes.length ) {
		cmdSay( `Error, no such quote exists.` );
		return;
	}
	if ( cmds.quotes[i].active == false ) {
		cmdSay( `Error, that quote has already been deleted.` );
		return;
	}

	cmds.quotes[cmd[1]].active = false;
	cmdSay( `Quote at id: ${i} has been deleted.` );
	save();
	refreshQuotes();
}

function delQuoteButton( i ) {
	if ( confirm( `Are you sure you want to delete "${cmds.quotes[i].message}" ?` ) ) {
		cmds.quotes[i].active = false;
		save();
		refreshQuotes();
	}
}

function refreshQuotes() {
	$("#quotes").html("");
	for ( var i = 0; i < cmds.quotes.length; i++ ) {
		if ( cmds.quotes[i].active ) {
			var output = "";
			output += `<button id='quote${i}' onclick='delQuoteButton(${i})'>delete</button> `;
			output += `${i} : `;
			output += `"<i>${cmds.quotes[i].message}</i>"`;
			output += `- <b>${cmds.quotes[i].who}</b>, ${cmds.quotes[i].date}`;
			output += `<br>`;
			$("#quotes").append( output );
			
			$("#quote"+i).button( {
				icons: {
					primary: "ui-icon-closethick"
				},
				text: false
			} );
		}
	}
	
}