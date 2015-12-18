/*
	Copyright (C) 2015  skhmt

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
// playtime is in ms since epoch, interval is in ms
var refreshInterval;
var hostInterval;
var viewerInterval;
var hostPlayTime;
var viewerPlayTime;

function timerSetup(){
	refreshInterval = 500; // in ms
	
	var now = new Date().getTime();
	
	hostInterval = 15*1000;
	viewerInterval = 60*1000;
	hostPlayTime = now;
	viewerPlayTime = now;
	
	
	timerTick();
}



function timerTick(){
	var now = new Date().getTime();
	
	for (var i = 0; i < timerList.length; i++){
		if (now >= timerList[i].playTime){ // if it's at or past the time to play the message
			cmdSay(timerList[i].message); // play the message
			timerList[i].playTime = now + timerList[i].interval; // set a new playTime
		}
	}
	
	if (now >= hostPlayTime && settings.channel != null) {
		updateHosts();
		hostPlayTime = now + hostInterval;
	}
	
	if (now >= viewerPlayTime && settings.channel != null) {
		updateUserlist();
		viewerPlayTime = now + viewerInterval;
	}

	chatScroll();

	setTimeout(function(){
		timerTick();
	}, refreshInterval);
}

function chatScroll(){
	var out = document.getElementById("console");
	if (out.scrollHeight - out.clientHeight <= out.scrollTop + 150) {
		out.scrollTop = out.scrollHeight - out.clientHeight;
	}
}