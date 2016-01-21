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
var currentSong;

function songsSetup() {
    $("#nextSongButton")
        .button()
        .click( function() {
            nextSong();
    } );

    $("#muteSongButton")
        .button()
        .click( function() {
            toggleMute();
    } );

    $("#addSongButton")
        .button()
        .click( function() {
            addSong( $("#addSongText").val(), settings.username );
            $("#addSongText").val("");
    } );
}

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('ytPlayer', {
        height: '254',
        width: '450',
        videoId: 'JFYVcz7h3o0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onError
        }
    } );
}

function onPlayerReady(event) {
    // event.target.playVideo();
}

function onPlayerStateChange(event) {
    if ( event.data === YT.PlayerState.ENDED ) {
        nextSong();
    }
}

/*
 * If there's an error (video doesn't work on non-websites, restricted by country, etc), go to the next song
 */
function onError(event) {
    nextSong();
}

function nextSong() {
    currentSong = null;
    if ( songQ.length > 0 ) {
        var tempSong = songQ.shift();
        ytPlayer.loadVideoById( tempSong.id, 0, "large" );
        ytPlayer.playVideo();
        currentSong = tempSong;
        updateSongList();
        fs.writeFile( execPath + "\\logs\\song.log", currentSong.title, function ( err ) {
            if ( err ) log( "* Error saving song log" );
        } );
    }   
}

function addSong(videoid, username) {

    // allows most copy-pastes to work
    if ( videoid.length != 11 ) {
        videoid = videoid.replace("https://", "");
        videoid = videoid.replace("http://", "");
        videoid = videoid.replace("youtu.be/", "");
        videoid = videoid.replace("www.youtube.com/watch?v=", "");
    }

    $.getJSON(
        "https://www.googleapis.com/youtube/v3/videos",
        {
            "id": videoid,
            "part": "snippet",
            "key": "AIzaSyDHIEtPmB3cOp2nHFA9T2LAz-xcfXyZJ2A"
        },
        function( response ) {
            if ( response.pageInfo.totalResults == 0 ) {
                cmdSay( "Error, invalid youtube video." );
            } else {
                var videotitle = response.items[0].snippet.title;

                /* add "contentDetails" to "part"
                var videoLength = response.items[0].contentDetails.duration.substring(2); // PT57M59S -> 57M59S
                videoLength = videoLength.split("M");
                if ( videoLength.length != 1 && videoLength[0] >= 10 ){ // if it is greater than 1 minute and also greater than 10 minutes 59 seconds
                    cmdSay( "Youtube video " + videotitle + " is over 10 minutes and will not added to the queue." );
                    return;
                }
                */
                
                var pushObj = { id: videoid, title: videotitle, user: username };
                songQ.push( pushObj );
                cmdSay( "\"" + videotitle + "\" added to the queue by " + username );

                updateSongList();

                // If after adding a song, the player isn't playing, start it
                if ( ytPlayer.getPlayerState() != YT.PlayerState.PLAYING ) {
                    nextSong();
                }
            }
        }
    );
}

function setVolume(vol) {
    if ( vol >= 0 && vol <= 100 ) {
        ytPlayer.setVolume( vol );
        cmdSay( "Volume set to " + vol);
    }
}

function getSong() {
    if ( currentSong == null ) {
        cmdSay( "No song is playing." );
    }
    else {
        cmdSay( "\"" + currentSong.title + "\", requested by " + currentSong.user );
    }
}

// re-writes the song list
function updateSongList() {
    var output = "";
    for ( var i = 0; i < songQ.length; i++ ) {
        var order = i + 1;
        output += "<span class='labelText'>" + order + ".</span> " + songQ[i].title + "<br>";
    }

    $("#songList").html( output );
}

function toggleMute() {
    if ( ytPlayer.isMuted() ) {
        ytPlayer.unMute();
        $("#muteSongStatus").html("");
        cmdSay( "The song has been unmuted.");
    }
    else {
        ytPlayer.mute();
        $("#muteSongStatus").html("SONG IS MUTED!");
        cmdSay( "The song has been muted.");
    }
}