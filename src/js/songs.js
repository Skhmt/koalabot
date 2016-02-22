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
var songSettings = {};

function songsSetup() {

    $("#nextSongButton").click( function() {
        nextSong();
    } );

    $("#muteSongButton").click( function() {
        toggleMute(false);
    } );

    $("#addSongButton").click( function() {
        addSong( $("#addSongText").val(), settings.username, true );
        $("#addSongText").val("");
    } );

    $("#addSongButtonStreamer").click( function() {
        addSongStreamer( $("#addSongText").val() );
        $("#addSongText").val("");
    } );

    $("#volDownSongButton").click( function() {
        var vol = ytPlayer.getVolume();
        vol -= 10;
        if ( vol < 0 ) vol = 0;
        ytPlayer.setVolume( vol );
        $("#songVolume").css( "width", ( vol*0.01*$("#songVolumeContainer").width() ) + "px" );
    } );

    $("#volUpSongButton").click( function() {
        var vol = ytPlayer.getVolume();
        vol += 10;
        if ( vol > 100 ) vol = 100;
        ytPlayer.setVolume( vol );
        $("#songVolume").css( "width", ( vol*0.01*$("#songVolumeContainer").width() ) + "px" );
    } );

    $("#songShuffleStreamer").click( function() {
        songSettings.streamerQueue = shuffleArray( songSettings.streamerQueue );
        updateStreamerSongList();
    } );

    $("#songVolumeContainer").click( function(e) {
        var offset = $(this).offset();
        var pixelsFromLeft = e.pageX - offset.left;
        var containerWidth = $("#songVolumeContainer").width();
        var vol = Math.round( (pixelsFromLeft/containerWidth)*100 );
        ytPlayer.setVolume( vol );
        $("#songVolume").css( "width", ( vol*0.01*$("#songVolumeContainer").width() ) + "px" );
    } );

    try {
        var readFile = fs.readFileSync( `${execPath}settings/songSettings.ini` );
        songSettings = $.parseJSON( readFile );
    } catch(e) { // if there isn't a modSettings.ini, just use the default settings
        songSettings = {
            songRequests : true,
            songPointCost : 0,
            streamerQueue : [] // {id:string, name:string}
        };
    }

    // songs radio state
    if ( songSettings.songRequests ) {
        $("#songsOn").prop( "checked", true );
        $("#songsOn").parent().addClass("active");
    } else {
        $("#songsOff").prop( "checked", true );
        $("#songsOff").parent().addClass("active");
    }

    // songs click listener
    $("input[name='songsRadio']").change( function() {
        if ( this.value === "on" ){
            songSettings.songRequests = true;
        } else {
            songSettings.songRequests = false;
        }
    } );

    // song point cost listener and setter
    $("#songPointCost").val( songSettings.songPointCost );
    $("#songPointCost").on( "input", function() {
        songSettings.songPointCost = $("#songPointCost").val();
    } );

    ytPlayer = document.getElementById("ytPlayer").contentWindow;
    updateStreamerSongList();
    songStateChecker();
}

function songStateChecker() {
    var status;
    try { status = ytPlayer.getPlayerState(); }
    catch (e) {}

    // YT.PlayerState.(unstarted?) == -1
    // YT.PlayerState.ENDED == 0
    // YT.PlayerState.PLAYING == 1
    // YT.PlayerState.PAUSED == 2
    // YT.PlayerState.BUFFERING == 3
    // YT.PlayerState.CUED == 5

    if ( status === 0 ) { // YT.PlayerState.ENDED == 0
        nextSong();
    }
    setTimeout( songStateChecker, 500 );
}

function nextSong() {

    currentSong = null;
    if ( songQ.length > 0 ) {
        var tempSong = songQ.shift();
        ytPlayer.loadVideoById( tempSong.id, 0, "large" );
        ytPlayer.playVideo();
        currentSong = tempSong;
        updateSongList();
        fs.writeFile( `${execPath}txt/song-current.txt`, currentSong.title );
    } else { // try the streamerqueue
        if (songSettings.streamerQueue.length > 0 ) {
            var tempSong = songSettings.streamerQueue.shift();
            ytPlayer.loadVideoById( tempSong.id, 0, "large" );
            ytPlayer.playVideo();
            currentSong = tempSong;
            songSettings.streamerQueue.push( tempSong );
            updateStreamerSongList();
            fs.writeFile( `${execPath}txt/song-current.txt`, currentSong.title );
        }
    }
}

function addSongStreamer(videoid) {

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
            "key": ytAPIkey
        },
        function( response ) {
            if ( response.pageInfo.totalResults == 0 ) {
                cmdSay( "Error, invalid youtube video." );
            } else {
                var videotitle = response.items[0].snippet.title;

                var pushObj = { id: videoid, title: videotitle};
                songSettings.streamerQueue.push( pushObj );
                log( `* "${videotitle}" added to the streamer song queue.` );

                updateStreamerSongList();

                // If after adding a song, the player isn't playing, start it
                if ( ytPlayer.getPlayerState() != 1 ) { // YT.PlayerState.PLAYING == 1
                    nextSong();
                }
            }
        }
    );
}

function addSong(videoid, username) {

    var userpoints = apiGetPoints(username);
    if ( userpoints == null ) {
        cmdSay( `Sorry ${username}, you don't have enough points to request a song. :(` );
        return;
    }
    else if ( userpoints < songSettings.songPointCost ) {
        cmdSay( `Sorry ${username}, you don't have enough points to request a song. :(` );
        return;
    }

    apiModPoints( username, -1*(songSettings.songPointCost) );

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
            "key": ytAPIkey
        },
        function( response ) {
            if ( response.pageInfo.totalResults == 0 ) {
                cmdSay( "Error, invalid youtube video." );
            } else {
                var videotitle = response.items[0].snippet.title;

                var pushObj = { id: videoid, title: videotitle, user: username  };
                songQ.push( pushObj );
                cmdSay( `"${videotitle}" added to the queue by ${username}` );

                updateSongList();

                // If after adding a song, the player isn't playing, start it
                if ( ytPlayer.getPlayerState() != 1 ) { // YT.PlayerState.PLAYING == 1
                    nextSong();
                }
            }
        }
    );
}

function deleteSongStreamer(index) {
    songSettings.streamerQueue.splice( index, 1 );
    updateStreamerSongList();
}

function cmdAddSong( params, from ) {
	if ( !songSettings.songRequests ) return;
    addSong( params[0], from );
}

function cmdSetVolume( params, from ) {
    if ( !songSettings.songRequests ) return;

    var vol = params[0];

    if ( vol >= 0 && vol <= 100 ) {
        ytPlayer.setVolume( vol );
        $("#songVolume").css( "width", ( vol*0.01*$("#songVolumeContainer").width() ) + "px" );
        cmdSay( `Volume set to ${vol}` );
    }
}

function cmdGetSong( params, from ) {
    if ( !songSettings.songRequests ) return;

    if ( currentSong == null ) {
        cmdSay( "No song is playing." );
    }
    else {
        if ( currentSong.user != null ) {
            cmdSay( `The current song is "${currentSong.title}", requested by ${currentSong.user}` );
        } else {
            cmdSay( `The current song is "${currentSong.title}"` );
        }
    }
}

function cmdSkipSong( params, from ) {
	if ( !songSettings.songRequests ) return;
    nextSong();
}

function cmdMute( params, from ) {
	if ( !songSettings.songRequests ) return;
    toggleMute(true);
}

// re-writes the song list
function updateSongList() {
    var output = "";
    for ( var i = 0; i < songQ.length; i++ ) {
        var order = i + 1;
        output += `<strong>${order}.</strong> ${songQ[i].title}<br>`;
    }

    $("#songList").html( output );
}

function updateStreamerSongList() {
    var output = "";
    for ( var i = 0; i < songSettings.streamerQueue.length; i++ ) {
        var order = i + 1;
        output += `<button onclick="deleteSongStreamer(${i})"
                class="btn btn-danger btn-xs"><span class="glyphicon glyphicon-remove"></span>
                </button> &nbsp;
                <strong>${order}.</strong> ${songSettings.streamerQueue[i].title}<br>`;
    }

    $("#songListStreamer").html( output );
}

function toggleMute(chat) {
    if ( ytPlayer.isMuted() ) {
        ytPlayer.unMute();
        $("#songVolume").addClass("progress-bar-success");
        $("#songVolume").removeClass("progress-bar-warning");
        if (chat) cmdSay( "The song has been unmuted.");
    }
    else {
        ytPlayer.mute();
        $("#songVolume").addClass("progress-bar-warning");
        $("#songVolume").removeClass("progress-bar-success");
        if (chat) cmdSay( "The song has been muted.");
    }
}

function shuffleArray(unshuffled) {
	var i = unshuffled.length;
	while ( i > 0 ) {
		var selectindex = Math.floor(Math.random() * i);
		i--;
		var swap = unshuffled[i];
		unshuffled[i] = unshuffled[selectindex];
		unshuffled[selectindex] = swap;
	}
	return unshuffled;
}
