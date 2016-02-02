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

    $("#nextSongButton").click( function() {
        nextSong();
    } );

    $("#muteSongButton").click( function() {
        toggleMute();
    } );

    $("#addSongButton").click( function() {
        addSong( $("#addSongText").val(), settings.username );
        $("#addSongText").val("");
    } );


    // songs radio state
    if ( cmdSettings.songRequests ) {
        $("#songsOn").prop( "checked", true );
        $("#songsOn").parent().addClass("active");
    } else {
        $("#songsOff").prop( "checked", true );
        $("#songsOff").parent().addClass("active");
    }

    // songs click listener
    $("input[name='songsRadio']").change( function() {
        if ( this.value === "on" ){
            cmdSettings.songRequests = true;
        } else {
            cmdSettings.songRequests = false;
        }
        save();
    } );
}


function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('ytPlayer', {
        height: 250,
        width: 400,
        videoId: 'JFYVcz7h3o0',
        playerVars: {
            fs: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onError
        }
    } );

    fs.writeFile( `${execPath}\\logs\\song.log`, "", function ( err ) {
        if ( err ) log( "* Error saving song log" );
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
    if ( !cmdSettings.songRequests ) return;

    currentSong = null;
    if ( songQ.length > 0 ) {
        var tempSong = songQ.shift();
        ytPlayer.loadVideoById( tempSong.id, 0, "large" );
        ytPlayer.playVideo();
        currentSong = tempSong;
        updateSongList();
        fs.writeFile( `${execPath}\\logs\\song.log`, currentSong.title, function ( err ) {
            if ( err ) log( "* Error saving song log" );
        } );
    }   
}

function addSong(videoid, username) {
    if ( !cmdSettings.songRequests ) return;

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
                
                var pushObj = { id: videoid, title: videotitle, user: username };
                songQ.push( pushObj );
                cmdSay( `"${videotitle}" added to the queue by ${username}` );

                updateSongList();

                // If after adding a song, the player isn't playing, start it
                if ( ytPlayer.getPlayerState() != YT.PlayerState.PLAYING ) {
                    nextSong();
                }
            }
        }
    );
}

function cmdAddSong(params, from, mod, subscriber) {
    addSong( params[0], from );
}

function cmdSetVolume(params, from, mod, subscriber) {
    if ( !cmdSettings.songRequests ) return;
    if ( !mod ) return;

    var vol = params[0];

    if ( vol >= 0 && vol <= 100 ) {
        ytPlayer.setVolume( vol );
        cmdSay( `Volume set to ${vol}` );
    }
}

function cmdGetSong(params, from, mod, subscriber) {
    if ( !cmdSettings.songRequests ) return;

    if ( currentSong == null ) {
        cmdSay( "No song is playing." );
    }
    else {
        cmdSay( `"${currentSong.title}", requested by ${currentSong.user}` );
    }
}

function cmdSkipSong(params, from, mod, subscriber){
    if ( mod ) {
        nextSong();
    }
}

function cmdMute(params, from, mod, subscriber){
    if ( mod ) {
        toggleMute();
    }
}

// re-writes the song list
function updateSongList() {
    var output = "";
    for ( var i = 0; i < songQ.length; i++ ) {
        var order = i + 1;
        output += `<span class="labelText">${order}.</span> ${songQ[i].title}<br>`;
    }

    $("#songList").html( output );
}

function toggleMute() {
    if ( !cmdSettings.songRequests ) return;
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