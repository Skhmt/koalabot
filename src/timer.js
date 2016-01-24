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



function timerSetup() {
	
	var now = new Date().getTime();

	var timerSettings = {
		refreshInterval: 100,
		hostInterval: 10*1000,
		viewerInterval: 15*1000,
		followerInterval: 10*1000,
		subInterval: 10*1000,
		hostPlayTime: now,
		viewerPlayTime: now,
		followerPlayTIme: now,
		subPlayTime: now,
	};
	
	timerTick( timerSettings );
}



function timerTick( timerSettings ) {
	var now = new Date().getTime();
	
	for ( var i = 0; i < timerList.length; i++ ) {
		if ( now >= timerList[i].playTime ) { // if it's at or past the time to play the message
			cmdSay( timerList[i].message ); // play the message
			timerList[i].playTime = now + timerList[i].interval; // set a new playTime
		}
	}
	
	if ( now >= timerSettings.hostPlayTime && settings.channel !== null ) {
		updateHosts();
		timerSettings.hostPlayTime = now + timerSettings.hostInterval;
	}
	
	if ( now >= timerSettings.viewerPlayTime && settings.channel !== null ) {
		updateUserlist();
		timerSettings.viewerPlayTime = now + timerSettings.viewerInterval;
	}

	if ( now >= timerSettings.followerPlayTime && settings.channel !== null ) {
		updateFollowers();
		timerSettings.followerPlayTime = now + timerSettings.followerInterval;
	}

	if ( now >= timerSettings.subPlayTime && settings.channel !== null ) {
		updateSubs();
		timerSettings.subPlayTime = now + timerSettings.subInterval;
	}

	chatScroll();

	setTimeout( function() {
		timerTick( timerSettings );
	}, timerSettings.refreshInterval );
}

function chatScroll() {
	var out = document.getElementById("console");
	if ( out.scrollHeight - out.clientHeight <= out.scrollTop + 150 ) {
		out.scrollTop = out.scrollHeight - out.clientHeight;
	}
}