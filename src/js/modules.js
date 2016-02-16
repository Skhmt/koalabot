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

/**
 * @title Modules API
 * @author skhmt
 * @license GPLv3
 * @overview The API for use with KoalaBot modules
 */

function apiSetup() {
    // Checking for mods folder, creating if not found
    try { fs.accessSync( `${execPath}mods` ); }
    catch (e) { fs.mkdirSync( `${execPath}mods` ); }

    // Adding mods to the program

    fs.readdir(`${execPath}mods`, function(err, files){
        var output = "";
        for ( var f = 0; f < files.length; f++ ) {
            if ( files[f].split(".")[1] == "js" ) {
                output += `<script type="text/javascript" src="${apiGetPath() + files[f]}"></script>`;
				$("#moduleListNames").append(`
					<li class="list-group-item">
						${files[f]}
					</li>`);
            }
        }
        $("head").append( output );
    } );
}

/**
 * Adds a command, makes it lower case. It will call the function name you send it.
 * The function will be given these parameters: params (array), from (string), mod (boolean), subscriber (boolean)
 * @param {String} keyword - The !command a user types in
 * @param {String} functionName - What function to call.
 * @return {Boolean} True if success, false if fail
 */
function apiAddCmd(keyword, functionName) {
    try {
        cmdList.push({ cmd: keyword.toLowerCase(), func: functionName });
		$("#moduleListCommands").append(`
			<li class="list-group-item">
				${cmdSettings.symbol} ${keyword.toLowerCase()}
			</li>`);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Adds a module to the dropdown and creates a page.
 * If the module only adds commands and doesn't require a user interface, this doesn't need to be used.
 * @param {String} moduleName - the name of the module
 * @return {String} the id of the page to $(id).prepend / $(id).html / $(id).append
 */
function apiAddTab(moduleName) {
    var newName = moduleName;
    newName = newName.replace(/"/g, ""); // removes quotation marks to prevent breaking
    newName = newName.replace(/\s/g, "-"); // removes spaces

    // creates a new tab in the modules dropdown
    $("#moduleMenu").append(`
        <li><a href="#tab-module-${newName}" data-toggle="tab">
        ${moduleName}
        </a></li>`);

    // creates the pane
    $("#pageContent").append(`
        <div class="tab-pane" id="tab-module-${newName}">
        </div>`);

    return `#tab-module-${newName}`;
}

/**
 * Writes to the chat. It outputs as [+] to show it's a module rather than [!] that the base bot uses.
 * @param {String} text - The text to say in the chat
 */
function apiSay(text) {
    bot.say( settings.channel, text );
    log( `<b>[+] ${text}</b>` );
}

/**
 * Only outputs to the chatlog and your chat window, but does not send a chat message for others to see.
 * It is used to notify the streamer of things.
 * @param {String} text - The text to log
 */
function apiLog(text) {
    log( `<b>[-] ${text}</b>` );
}

/**
 * Gets the path to the mods folder, ex:  C:\bot\mods\
 * @return {String} path to the mods folder, including trailing slash
 */
function apiGetPath() {
    return `${execPath}mods/`;
}

/**
 * Gets the channel name, which is likely also the streamer's name.
 * @return {String} the channel name
 */
function apiGetChannelName() {
    return settings.channel.substring(1);
}

/**
 * Gets the bot name.
 * @return {String} the bot name
 */
function apiGetBotName() {
    return settings.username;
}

/**
 * Gets the unit for points.
 * @return {String} the points unit
 */
function apiGetPointsUnit() {
    return pointsSettings.unit;
}

/**
 * Gets the number of points a user has.
 * @param {String} username - case insensitive
 * @return {integer} null if not found, otherwise the amount of points of the user
 */
function apiGetPoints(username) {
    var index = getPointIndex(username);
    if ( index == -1 ) {
        return null;
    }
    return pointsSettings.users[index].currentPoints;
}

/**
 * Sets the points a user has.
 * @param {String} username - case insensitive
 * @param {integer} points - what to set the user's points to
 * @return {integer} null if not found, otherwise the amount of points of the user
 */
function apiSetPoints(username, points) {
    var index = getPointIndex(username);
    if ( index == -1 ) {
        return null;
    }
    pointsSettings.users[index].currentPoints = parseInt( points, 10 );
    save();
    drawList();
    return pointsSettings.users[index].currentPoints;
}

/**
 * Modifies the points a user has.
 * @param {String} username - case insensitive
 * @param {integer} points - what to add to the uesr's points. To subtract, send a negative number
 * @return {integer} null if not found, otherwise the amount of points of the user
 */
function apiModPoints(username, points) {
    var index = getPointIndex(username);
    if ( index == -1 ) {
        return null;
    }
    pointsSettings.users[index].currentPoints += parseInt( points, 10 );

    save();
    drawList();
    return pointsSettings.users[index].currentPoints;
}

/**
 * Opens a file in the \mods\ directory.
 * To load an object, do something like:  $.parseJSON( apiOpenFile("modExampleSettings.ini") );
 * @param {String} filename - case sensitive, the path to the \mods\ directory is included
 * @return {String} the file contents, null if it doesn't exist
 */
function apiOpenFile(filename) {
    try {
        return fs.readFileSync( `${execPath}mods/${filename}`, "utf8" );
    }
    catch (e) {
        return null;
    }
}

/**
 * Appends a new line of text to the end a file in the \mods\ directory.
 * If a file isn't found, it will automatically be created, then appended to.
 * @param {String} filename - case sensitive, the path to the \mods\ directory is included
 * @param {String} text - what to add to the contents of the file
 * @return {string} true if success, false if fail
 */
function apiAppendFile(filename, text) {
    try {
        fs.appendFileSync( `${execPath}mods/${filename}`, `${text}\r\n`, "utf8" );
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Writes a file in the \mods\ directory. This will completely over-write an existing file.
 * To save an object, do something like:  apiWriteFile( "modExampleSettings.ini", JSON.stringify( modExampleSettings ) );
 * @param {String} filename - case sensitive, the path to the \mods\ directory is included
 * @param {String} text - what to make the contents of the file
 * @return {Boolean} true if success, false if fail
 */
function apiWriteFile(filename, text) {
    try {
        fs.writeFileSync( `${execPath}mods/${filename}`, text, "utf8" );
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Gets an array of the recent events, in format:
 * { "time": (integer milliseconds since midnight of January 1, 1970), "type": (string), "text": (string) }
 * Type will be "SUB", "HOST", "FOLLOW", or anything that a module adds
 * @return {Array}
 */
function apiGetRecentEvents() {
    return recentEvents;
}

/**
 * Adds to the recent events array. Recent events is used to send to a page via ajax, most likely.
 * @param {String} type - can be anything, the bot uses SUB, HOST, and FOLLOW for those events
 * @param {String} text - the data. For SUB, HOST, and FOLLOW, it's only the username.
 */
function apiAddRecentEvent(type, text) {
    var td = new Date();
    recentEvents.unshift({"time": td.getTime(), "type": type, "text": text});
}

/**
 * Adds a global hotkey. Supported keys: A-Z, 0-9, Comma, Period, Home, End, PageUp,
 * PageDown, Insert, Delete, Arrow keys (Up, Down, Left, Right) and the Media Keys
 * (MediaNextTrack, MediaPlayPause, MediaPrevTrack, MediaStop)
 * Combine them with Ctrl, Alt, or Shift. Ex: "Ctrl+Alt+Comma"
 * On OSX, Ctrl is command. These global hotkeys will block the normal function
 * of those keys.
 * @param {String} hotkey - See above comments on format
 * @return {object} shortcut - use to set functionality of the hotkey: shortcut.on("active", function(){ });
 */
function apiHotkey(hotkey) {
	// see: https://github.com/nwjs/nw.js/wiki/Shortcut
	var gui = require("nw.gui");
	var shortcut = new gui.Shortcut( {
		key : hotkey,
		active : function () {
			console.log(`Hotkey used: ${hotkey}`);
		},
		failed : function(msg) {
			console.log(msg);
		}
	} );
	gui.App.registerGlobalHotKey(shortcut);

	$("#moduleListHotkeys").append(`
		<li class="list-group-item">
			${hotkey}
		</li>`);

	return shortcut;
}
