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

// moderation.js

var modSettings;

function moderationSetup(){

	try {
		var readFile = fs.readFileSync( `${execPath}settings/modSettings.ini` );
		modSettings = $.parseJSON( readFile );
	} catch(e) { // if there isn't a modSettings.ini, just use the default settings
		modSettings = {
			linkPro : {
				on: true,
				timeout : 1,
				timeoutText : "%user% don't post links without permission"
			},
			wordPro : {
				on: true,
				timeout : 1,
				timeoutText : "%user% don't say that!",
				badwords : ["hitbox"]
			},
			capsPro : {
				on: true,
				timeout : 1,
				timeoutText : "%user% LOUD NOISES!!",
				capsPerWord : 4,
				capsTotal : 16
			},
			symbolPro : {
				on: true,
				timeout: 1,
				timeoutText: "%user% English only please thx",
				symbols : 8
			}
		};
	}

	// linkPro button states
	if ( modSettings.linkPro.on ) {
		$("#linkProRadioOn").prop( "checked", true );
		$("#linkProRadioOn").parent().addClass("active");
	} else {
		$("#linkProRadioOff").prop( "checked", true );
		$("#linkProRadioOff").parent().addClass("active");
	}

	// linkPro button click listener
	$("input[name='linkProRadio']").change( function() {
		if ( this.value === "on" ){
			modSettings.linkPro.on = true;
		} else {
			modSettings.linkPro.on = false;
		}
	} );

	// wordPro button states
	if ( modSettings.wordPro.on ) {
		$("#wordProRadioOn").prop( "checked", true );
		$("#wordProRadioOn").parent().addClass("active");
	} else {
		$("#wordProRadioOff").prop( "checked", true );
		$("#wordProRadioOff").parent().addClass("active");
	}

	// wordPro button click listener
	$("input[name='wordProRadio']").change( function() {
		if ( this.value === "on" ) {
			modSettings.wordPro.on = true;
		} else {
			modSettings.wordPro.on = false;
		}
	} );

	// capsPro button states
	if ( modSettings.capsPro.on ) {
		$("#capsProRadioOn").prop( "checked", true );
		$("#capsProRadioOn").parent().addClass("active");
	} else {
		$("#capsProRadioOff").prop( "checked", true );
		$("#capsProRadioOff").parent().addClass("active");
	}

	// capsPro button click listener
	$("input[name='capsProRadio']").change( function() {
		if ( this.value === "on" ) {
			modSettings.capsPro.on = true;
		} else {
			modSettings.capsPro.on = false;
		}
	} );

	// symbolPro button states
	if ( modSettings.capsPro.on ) {
		$("#symbolProRadioOn").prop( "checked", true );
		$("#symbolProRadioOn").parent().addClass("active");
	} else {
		$("#symbolProRadioOff").prop( "checked", true );
		$("#symbolProRadioOff").parent().addClass("active");
	}

	// symbolPro button click listener
	$("input[name='symbolProRadio']").change( function() {
		if ( this.value === "on" ) {
			modSettings.symbolPro.on = true;
		} else {
			modSettings.symbolPro.on = false;
		}
	} );

	// wordProArea settings
	$("#wordProArea").val( modSettings.wordPro.badwords.join(" ") );
	$("#wordProArea").change( function() {
		modSettings.wordPro.badwords = $(this).val().split(" ");
	} );

	// set up timeout states and listeners
	$("#linkProTimeoutField").val( modSettings.linkPro.timeout );
	$("#linkProTimeoutField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.linkPro.timeout = parseInt( tempNum, 10 );
	} );

	$("#linkProTimeoutText").val( modSettings.linkPro.timeoutText );
	$("#linkProTimeoutText").on( "input", function() {
		modSettings.linkPro.timeoutText = $(this).val();
	} );

	$("#wordProTimeoutField").val( modSettings.wordPro.timeout );
	$("#wordProTimeoutField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.wordPro.timeout = parseInt( tempNum, 10 );
	} );

	$("#wordProTimeoutText").val( modSettings.wordPro.timeoutText );
	$("#wordProTimeoutText").on( "input", function() {
		modSettings.wordPro.timeoutText = $(this).val();
	} );

	$("#capsProTimeoutField").val( modSettings.capsPro.timeout );
	$("#capsProTimeoutField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.capsPro.timeout = parseInt( tempNum, 10 );
	} );

	$("#capsProTimeoutText").val( modSettings.capsPro.timeoutText );
	$("#capsProTimeoutText").on( "input", function() {
		modSettings.capsPro.timeoutText = $(this).val();
	} );

	$("#capsProPerWordField").val( modSettings.capsPro.capsPerWord );
	$("#capsProPerWordField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.capsPro.capsPerWord = parseInt( tempNum, 10 );
	} );

	$("#capsProPerPostField").val( modSettings.capsPro.capsTotal );
	$("#capsProPerPostField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.capsPro.capsTotal = parseInt( tempNum, 10 );
	} );

	$("#symbolProTimeoutField").val( modSettings.symbolPro.timeout );
	$("#symbolProTimeoutField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.symbolPro.timeout = parseInt( tempNum, 10 );
	} );

	$("#symbolProTimeoutText").val( modSettings.symbolPro.timeoutText );
	$("#symbolProTimeoutText").on( "input", function() {
		modSettings.symbolPro.timeoutText = $(this).val();
	} );

	$("#symbolProSymbolsField").val( modSettings.symbolPro.symbols );
	$("#symbolProSymbolsField").on( "input", function() {
		var tempNum = $(this).val();
		modSettings.symbolPro.symbols = parseInt( tempNum, 10 );
	} );

}

function moderation( from, mod, text ) {
	if ( mod ) return;
	if ( from.toLowerCase() == settings.channel.substring(1) ) return;
	if ( from.toLowerCase() == settings.username.toLowerCase() ) return;

	if ( modSettings.linkPro.on ) {
		if( linkPro( from, text ) ) {
			log( `* Link protection timeout on: ${from}` );
			setTimeout( function() {
				bot.say( settings.channel, `/timeout ${from} ${modSettings.linkPro.timeout}` );
			}, 1000);
			if( modSettings.linkPro.timeoutText !== "" ) {
				var output = modSettings.linkPro.timeoutText;
				output = output.replace( /%user%/g, from );
				cmdSay( output );
			}
		}
	}

	if ( modSettings.wordPro.on ) {
		if( wordPro( text ) ) {
			log( `* Word protection timeout on: ${from}` );
			setTimeout( function() {
				bot.say( settings.channel, `/timeout ${from} ${modSettings.wordPro.timeout}` );
			}, 1000);
			if( modSettings.wordPro.timeoutText !== "" ) {
				var output = modSettings.wordPro.timeoutText;
				output = output.replace( /%user%/g, from );
				cmdSay( output );
			}
		}
	}

	if ( modSettings.capsPro.on ) {
		if( capsPro( text ) ) {
			log( `* Caps protection timeout on: ${from}` );
			setTimeout( function() {
				bot.say( settings.channel, `/timeout ${from} ${modSettings.capsPro.timeout}` );
			}, 1000);
			if( modSettings.capsPro.timeoutText !== "" ) {
				var output = modSettings.capsPro.timeoutText;
				output = output.replace( /%user%/g, from );
				cmdSay( output );
			}
		}
	}

	if ( modSettings.symbolPro.on ) {
		if( symbolPro( text ) ) {
			log( `* Symbol protection timeout on: ${from}` );
			setTimeout( function() {
				bot.say( settings.channel, `/timeout ${from} ${modSettings.symbolPro.timeout}` );
			}, 1000 );
			if( modSettings.symbolPro.timeoutText !== "" ) {
				var output = modSettings.symbolPro.timeoutText;
				output = output.replace( /%user%/g, from );
				cmdSay( output );
			}
		}
	}
}

function cmdPermit( params, from ) {
	var permitTime = 60;

	if ( !params[0] ) return cmdSay( `Usage: ${cmdSettings.symbol}permit [username]` );

	var user = params[0];

	cmdSay( `${user} has been permitted to post a link for ${permitTime} seconds.` );

	permitted.push( user.toLowerCase() );

	setTimeout( function() {
		var indexToRemove = permitted.indexOf( user.toLowerCase() );
		permitted.splice( indexToRemove, 1 );
	}, permitTime*1000);
}


// returns true if link protection finds a link
function linkPro( from, text ) {
	// if user isn't in the array "permitted" (is approved to post a link), return false
	var user = from.toLowerCase();

	console.log(`linkpro from: '${from}' user: '${user}' permitted: '${JSON.stringify(permitted)}' user in permitted: '${(user in permitted)}'`);
	if ( permitted.indexOf(user) >= 0 ) {
		return false;
	}

	var urlregex = new RegExp("^((https{0,1}|ftp|rtsp|mms){0,1}://){0,1}(([0-9a-z_!~\\*'\\(\\)\\.&=\\+\\$%\\-]{1,}:\\ ){0,1}[0-9a-z_!~\\*'\\(\\)\\.&=\\+\\$%\\-]{1,}@){0,1}(([0-9]{1,3}\\.){3,3}[0-9]{1,3}|([0-9a-z_!~\\*'\\(\\)\\-]{1,}\\.){0,}([0-9a-z][0-9a-z\\-]{0,61}){0,1}[0-9a-z]\\.[a-z]{2,6}|localhost)(:[0-9]{1,4}){0,1}((/{0,1})|(/[0-9a-z_!~\\*'\\(\\)\\.;\\?:@&=\\+\\$,%#\\-]{1,}){1,}/{0,1})$", "gi");

	var textArray = text.split(" ");

	for ( var i = 0; i < textArray.length; i++ ) {
		if ( urlregex.test(textArray[i]) ) {
			return true;
		}
	}
	return false;
}


function wordPro( text ) {
	// if word is in the list of prohibited words, do something bad
	var textArray = text.split(" ");

	for ( var i = 0; i < textArray.length; i++ ) {
		var lcword = textArray[i].toLowerCase();
		if ( modSettings.wordPro.badwords.indexOf( lcword ) !== -1 ) {
			return true;
		}
	}
	return false;

}

// returns true if more capitals than allowed are found
function capsPro( text ) {
	var textArray = text.split(" ");

	var totalCaps = 0;
	for ( var i = 0; i < textArray.length; i++ ) {
		var tempword = textArray[i];

		var capsCount = 0;
		for( var x = 0; x < tempword.length; x++ ) {
			var ch = tempword.charAt(x);
			if( ch >= 'A' && ch <= 'Z' ) {
				capsCount++;
				totalCaps++;
			}

			if ( capsCount > modSettings.capsPro.capsPerWord ) return true;
		}
	}
	if ( totalCaps > modSettings.capsPro.capsTotal ) return true;
	return false;
}

function symbolPro( text ) {
	var totalSymbols = 0;
	for ( var i = 0; i < text.length; i++ ) {
		var ch = text.charAt(i);
		if ( isSymbol(ch) ) {
			totalSymbols++;
		}
		if ( totalSymbols > modSettings.symbolPro.symbols ) return true;
	}
	return false;
}

// returns true if it's a symbol, defined by me as: non-number, non-english letter, non-space, and not "." nor ","
function isSymbol( ch ) {
	// https://en.wikipedia.org/wiki/List_of_Unicode_characters

	// space is 32, just beefore the exclamation point

	// ! " # $ % & ' ( ) * +
	if ( ch >= '!' && ch <= '+' ) return true;

	// skipping , and .

	if ( ch == '-' || ch == '/' ) return true;

	// skipping numbers

	// : ; < = > ? @
	if ( ch >= ':' && ch <= '@' ) return true;

	// skipping upper case characters

	// [ \ ] ^ _ `
	if ( ch >= '[' && ch <= '`' ) return true;

	// skipping lower case characters

	// { | } ~
	if ( ch >= '{' && ch <= '~' ) return true;

	// skipping &nbsp; (#160)
	if ( ch > '~' + 1 ) return true;

	return false;
}
