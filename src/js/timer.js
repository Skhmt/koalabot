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

//timer.js

var timerList = [];
// [{message: "", playTime: "", interval: ""}, ... ]
var timerSettings;


function timerSetup() {

	var now = $.now();

	timerSettings = {
		refreshInterval: 100,
		list: []
	};

	// host
	timerSettings.list.push( {
		interval: 10*1000,
		playTime: now,
		func: 'updateHosts'
	} );

	// viewer
	timerSettings.list.push( {
		interval: 20*1000,
		playTime: now,
		func: 'updateUserlist'
	} );

	// follower
	timerSettings.list.push( {
		interval: 15*1000,
		playTime: now,
		func: 'updateFollowers'
	} );

	// points
	timerSettings.list.push( {
		interval: pointsSettings.minutesPerUpdate*60*1000,
		playTime: now,
		func: 'updatePoints'
	} );

	// life points
	timerSettings.list.push( {
		interval: 60*1000,
		playTime: now,
		func: 'updateLifePoints'
	} );

	// save
	timerSettings.list.push( {
		interval: 150*1000,
		playTime: (now + 150*1000),
		func: 'save'
	} );

	timerTick();
}



function timerTick() {
	var now = $.now();

	for ( var i = 0; i < timerList.length; i++ ) {
		if ( now >= timerList[i].playTime ) { // if it's at or past the time to play the message
			cmdSay( timerList[i].message ); // play the message
			timerList[i].playTime = now + timerList[i].interval; // set a new playTime
		}
	}

	if ( settings.channel !== null ) {
		for ( var j = 0; j < timerSettings.list.length; j++ ) {
			if ( now >= timerSettings.list[j].playTime ) {
				eval( timerSettings.list[j].func + '();' );
				timerSettings.list[j].playTime = now + timerSettings.list[j].interval;
			}
		}
	}

	chatScroll();

	setTimeout( function() {
		timerTick();
	}, timerSettings.refreshInterval );
}

function chatScroll() {
	var out = document.getElementById("console");
	if ( out.scrollHeight - out.clientHeight <= out.scrollTop + 150 ) {
		out.scrollTop = out.scrollHeight - out.clientHeight;
	}
}
