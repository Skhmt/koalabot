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

var songQ = []; // [{id:11cha, title: songtitle, user:username}, ...]
var ytPlayer;
var ytAPIkey = "AIzaSyDHIEtPmB3cOp2nHFA9T2LAz-xcfXyZJ2A";

function songsSetup() {

    onYouTubeIframeAPIReady();
}

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('ytPlayer', {
        height: '254',
        width: '450',
        videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onError
        }
    });
}

function onPlayerReady(event) {
    // event.target.playVideo();
}

function onPlayerStateChange(event) {
    if ( event.data === YT.PlayerState.ENDED ) {
        if ( songQ.length == 0 ) {
            // play the botQ instead
        } else {
            nextSong();
        }
    }
}

function onError(event) {
    nextSong();
}

function nextSong() {
    ytPlayer.loadVideoById( songQ.shift().id, 0, "large" );
    ytPlayer.playVideo();
}

function addSong(videoid, username) {
    if ( videoid.length != 11 ) {
        cmdSay( "Error, invalid youtube video" );
        return;
    }


    // https://www.googleapis.com/youtube/v3/videos?id=M7lc1UVf-VE&part=snippet&key=AIzaSyDHIEtPmB3cOp2nHFA9T2LAz-xcfXyZJ2A
    // getJSON the above, object.items[0].snippet.title to get the video title
    // https://developers.google.com/youtube/v3/getting-started#quota

    var pushObj = {id: videoid, user: username};
    songQ.push(pushObj);
}