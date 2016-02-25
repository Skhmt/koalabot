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

var moduleCommands = [];

function apiSetup() {
    // Checking for mods folder, creating if not found
    try { fs.accessSync( `${execPath}mods` ); }
    catch (e) { fs.mkdirSync( `${execPath}mods` ); }

    // Adding mods to the program

    fs.readdir(`${execPath}mods`, function(err, files){
        for ( var f = 0; f < files.length; f++ ) {
            if ( files[f].split(".")[1] == "js" ) {
				$.getScript( apiGetPath() + files[f] );
				$("#moduleListNames").append(`
					<li class="list-group-item">
						${files[f]}
					</li>`);
            }
        }
    } );
}

/**
 * Adds a command, makes it lower case. It will call the function name you send it.
 * The function will be given these parameters: params (array), from (string), mod (boolean), subscriber (boolean)
 * @param {String} keyword - The !command a user types in
 * @param {String} functionName - What function to call.
 * @param {String} rbac - Role-based access control. Choose from: off, all, reg, sub, mod, or bot. Off disables the
 * command, even for the streamer. All is self explanatory. Reg is for regulars and above (sub, mod, bot).
 * Sub is for subscribers and above (mod, bot). Mod is for moderators and above (bot).
 * Bot is for the bot itself AND the streamer.
 * @param {String} desc - short description of the command
 * @return {boolean} True if success, false if fail
 */
function apiAddCmd(keyword, functionName, rbac, desc) {
    try {
        var keylc = keyword.toLowerCase();
        cmdList.push({ cmd: keylc, func: functionName, rbac: rbac });
        moduleCommands[keylc] = { rbac: rbac, desc: desc };
        apiRefreshModuleCommands();
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Refreshes the module command list
 */

function apiRefreshModuleCommands() {
    var output = `
    <div class="panel-heading"><h2 class="panel-title">Module Commands: </h2></div>
    <table class="table table-striped table-hover table-condensed">
        <tr>
            <th>Command</th>
            <th>Access</th>
            <th>Description</th>
        </tr>`;

    var moduleKeys = Object.keys(moduleCommands);
    for (var i = 0; i < moduleKeys.length; i++) {
        var keyword = moduleKeys[i];
        output += `<tr>
            <td>${keyword}</td>
            <td>${moduleCommands[keyword].rbac}</td>
            <td>${moduleCommands[keyword].desc}</td>
        </tr>`;
    }
    output += `</table>`;

    $("#moduleListCommands").html( output );
}

/**
 * Changes the access control of a module command
 * @param {String} keyword - the keyword to change
 * @param {String} rbac - the access control to set it to
 * @returns {boolean} - true if success, false if not found
 */
function apiChangeRBAC(keyword, rbac) {
    var keylc = keyword.toLowerCase();
    for (var i = 0; i < cmdList.length; i++) {
        if (cmdList[i].cmd === keylc) {
            cmdList[i].rbac = rbac;
            moduleCommands[keylc].rbac = rbac;
            apiRefreshModuleCommands();
            return true;
        }
    }
    return false;
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
	var usernameLC = username.toLowerCase();
    if ( !pointsSettings.users[usernameLC] ) {
        return null;
    }
    return pointsSettings.users[usernameLC].currentPoints;
}

/**
 * Sets the points a user has.
 * @param {String} username - case insensitive
 * @param {integer} points - what to set the user's points to
 * @return {integer} null if not found, otherwise the amount of points of the user
 */
function apiSetPoints(username, points) {
	var usernameLC = username.toLowerCase();
    if ( !pointsSettings.users[usernameLC] ) {
        return null;
    }
    pointsSettings.users[usernameLC].currentPoints = parseInt( points, 10 );
    drawList();
    return pointsSettings.users[usernameLC].currentPoints;
}

/**
 * Modifies the points a user has.
 * @param {String} username - case insensitive
 * @param {integer} points - what to add to the uesr's points. To subtract, send a negative number
 * @return {integer} null if not found, otherwise the amount of points of the user
 */
function apiModPoints(username, points) {
	var usernameLC = username.toLowerCase();
    if ( !pointsSettings.users[usernameLC] ) {
        return null;
    }
    pointsSettings.users[usernameLC].currentPoints += parseInt( points, 10 );

    drawList();
    return pointsSettings.users[usernameLC].currentPoints;
}

/**
 * Gets the number of minutes a user has been in the stream while the bot is also in the stream.
 * @param {String} username - case insensitive
 * @return {integer} null if not found, otherwise the amount of minutes the user has been in the stream
 */
function apiGetMinutes(username) {
    var usernameLC = username.toLowerCase();
    if ( !pointsSettings.users[usernameLC] ) {
        return null;
    }
    return pointsSettings.users[usernameLC].totalPoints;
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
 * @return {boolean} true if success, false if fail
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


function apiDB(filename) {
	if (!filename) return null;

	var my = {};

	my._db; // = new sql.Database();

	my.write = function() {
		try {
			var binArray = my._db.export();
			var buffer = new Buffer( binArray );
			fs.writeFileSync( filename, buffer );
			return true;
		} catch (err) {
			console.log(err);
			return false;
		}
	};

	my.sel = function(query) {
		try {
			var response = my._db.exec(query);
			return {array: response, table: tableify(response)};
		} catch(err) {
			console.log(err);
			return null;
		}
	};

	// CREATE TABLE / INSERT INTO / DELETE FROM
	my.run = function(query) {
		try {
			my._db.run(query);
			return true;
		} catch(err) {
			console.log(err);
			return false;
		}
	};

	try {
		var file = fs.readFileSync( filename );
		my._db = new sql.Database( file );
	} catch(err) {
		// console.log(err);
		my._db = new sql.Database();
		my.write();
	}

	function tableify(table) {
		var output = '';
		for ( var x = 0; x < table.length; x++ ) {
			output += '<table class="table table-striped table-condensed">';

			// making table headers
			output += '<tr>';
			for ( var i = 0; i < table[x].columns.length; i++ ) {
				output += `<th> ${table[x].columns[i]} </th>`;
			}
			output += '</tr>';

			// making data
			for ( var row = 0; row < table[x].values.length; row++ ) {
				output += '<tr>';
				for ( var col = 0; col < table[x].values[row].length; col++ ) {
					output += `<td> ${table[x].values[row][col]} </td>`;
				}
				output += '</tr>';
			}

			output += '</table>';
		}
		return output;
	}

	return my;
};
