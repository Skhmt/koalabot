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

var eventSettings = {};
var followers = [];
var subs = [];

function eventSetup() {
    try {
        var readFile = fs.readFileSync( `${execPath}\\settings\\eventSettings.ini` );
        eventSettings = $.parseJSON( readFile );
    } catch(e) { // if there isn't a modSettings.ini, just use the default settings
        eventSettings = {
            followerChat: true,
            hostChat: true,
            subChat: true,
            followerChatText: "Thanks for the follow %user%!",
            hostChatText: "%user% is now hosting!",
            subChatText: "Thanks for the sub %user%!!",
            isPartnered: false
        };
    }

    // follower chat radio state
    if ( eventSettings.followerChat ) {
        $("#followerChatOn").prop( "checked", true );
        $("#followerChatOn").parent().addClass("active");
    } else {
        $("#followerChatOff").prop( "checked", true );
        $("#followerChatOff").parent().addClass("active");
    }

    // event chat radio state
    if ( eventSettings.hostChat ) {
        $("#hostChatOn").prop( "checked", true );
        $("#hostChatOn").parent().addClass("active");
    } else {
        $("#hostChatOff").prop( "checked", true );
        $("#hostChatOff").parent().addClass("active");
    }

    // sub chat radio state
    if ( eventSettings.subChat ) {
        $("#subChatOn").prop( "checked", true );
        $("#subChatOn").parent().addClass("active");
    } else {
        $("#subChatOff").prop( "checked", true );
        $("#subChatOff").parent().addClass("active");
    }

    // follower chat click listener
    $("input[name='followerChatRadio']").change( function() {
        if ( this.value === "on" ){
            eventSettings.followerChat = true;
        } else {
            eventSettings.followerChat = false;
        }
        save();
    } );

    // host chat click listener
    $("input[name='hostChatRadio']").change( function() {
        if ( this.value === "on" ){
            eventSettings.hostChat = true;
        } else {
            eventSettings.hostChat = false;
        }
        save();
    } );

    // sub chat click listener
    $("input[name='subChatRadio']").change( function() {
        if ( this.value === "on" ){
            eventSettings.subChat = true;
        } else {
            eventSettings.subChat = false;
        }
        save();
    } );

    // follower text initial setup and listener
    $("#followerChatText").val( eventSettings.followerChatText );
    $("#followerChatText").on( "input", function() {
        eventSettings.followerChatText = $("#followerChatText").val();
        save();
    } );

    // host text initial setup and listener
    $("#hostChatText").val( eventSettings.hostChatText );
    $("#hostChatText").on( "input", function() {
        eventSettings.hostChatText = $("#hostChatText").val();
        save();
    } );

    // sub text initial setup and listener
    $("#subChatText").val( eventSettings.subChatText );
    $("#subChatText").on( "input", function() {
        eventSettings.subChatText = $("#subChatText").val();
        save();
    } );
}

function updateHosts() {
    // get hosts into json
    if ( settings.id == null || settings.id == "" ) return;

    $.getJSON(
        "http://tmi.twitch.tv/hosts",
        {
            "include_logins" : "1",
            "target" : settings.id
        },
        function( response ) {
            // make an array of current hosts
            for ( var i = 0; i < response.hosts.length; i++ ) {
                var tempHost = response.hosts[i].host_login;
                if( hosts.indexOf( tempHost ) === -1 ) { // if the host is not in the current list of hosts
                    // add to the list of hosts to prevent duplication in the future
                    hosts.push( tempHost );

                    // add to the hosts tab
                    $("#hosts").append( `${getTimeStamp()} Host: ${tempHost} <br>` );

                    // log or chat the host
                    if ( eventSettings.hostChat ) {
                        var output = eventSettings.hostChatText;
                        output = output.replace( /%user%/g, tempHost );
                        cmdSay( output );
                    } else {
                        log(`* ${getTimeStamp()} ${tempHost} is hosting ${settings.channel}`);
                    }

                    // write to host file
                    fs.appendFile( hostFile, `${tempHost}\r\n`, function ( err ) {
                        if ( err ) log( "* Error writing to host file" );
                    } );
                }
            }
        }
    ).fail(function( jqxhr, textStatus, error) {
        console.log(`Request Failed: ${textStatus}, ${error}`);
    } );
}

function getFollowers() {
    followers = [];
    $.getJSON(
        `https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}/follows`,
        {
            "limit": 100
        },
        function ( response ) {
            if ( !("follows" in response) ) {
                return;
            }
            for ( var i = 0; i < response.follows.length; i++ ) {
                followers.push( response.follows[i].user.display_name );
            }
        }
    );
}

function updateFollowers() {
    $.getJSON(
        `https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}/follows`,
        {
            "limit": 100,
            "client_id" : clientid,
            "api_version" : 3
        },
        function ( response ) {
            if ( !("follows" in response) ) return;
            for ( var i = 0; i < response.follows.length; i++ ) {
                var tempUser = response.follows[i].user.display_name;
                // if not a current follower...
                if ( followers.indexOf( tempUser ) == -1 ) {
                    followers.unshift( tempUser );

                    // writing to the host file
                    $("#hosts").append( `${getTimeStamp()} Follow: ${tempUser}<br>` );

                    // chatting or logging depending on user's settings
                    if ( eventSettings.followerChat ) {
                        var output = eventSettings.followerChatText;
                        output = output.replace( /%user%/g, tempUser );
                        cmdSay( output );
                    } else {
                        log( `* ${getTimeStamp()} ${tempUser} is following` );
                    }
                }
            }
        }
    ).fail(function() {});
}

function getSubs() {
    if ( !eventSettings.isPartnered ) {
        return false;
    }

    subs = [];
    $.getJSON(
        `https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}/subscriptions`,
        {
            "limit": 100,
            "client_id" : clientid,
            "api_version" : 3,
            "oauth_token" : settings.access_token.substring(6)
        },
        function ( response ) {
            for ( var i = 0; i < response.subscriptions.length; i++ ) {
                subs.push( response.subscriptions[i].user.display_name );
            }
        }
    );
}

function updateSubs() {
    if ( !eventSettings.isPartnered ) {
        return false;
    }

    $.getJSON(
        `https://api.twitch.tv/kraken/channels/${settings.channel.substring(1)}/subscriptions`,
        {
            "limit": 100,
            "client_id" : clientid,
            "api_version" : 3,
            "oauth_token" : settings.access_token.substring(6)
        },
        function ( response ) {
            
            if ( !("subscriptions" in response) ) {
                return;
            }
            for ( var i = 0; i < response.subscriptions.length; i++ ) {
                var tempUser = response.subscriptions[i].user.display_name;
                // if not a current follower...
                if ( followers.indexOf( tempUser ) == -1 ) {
                    followers.unshift( tempUser );

                    // writing to the host file
                    $("#hosts").append( `${getTimeStamp()} Sub: ${tempUser}<br>` );

                    // chatting or logging depending on user's settings
                    if ( eventSettings.subChat ) {
                        var output = eventSettings.subChatText;
                        output = output.replace( /%user%/g, tempUser );
                        cmdSay( output );
                    } else {
                        log( `* ${getTimeStamp()} ${tempUser} is subscribing` );
                    }
                }
            }
        }
    );
}