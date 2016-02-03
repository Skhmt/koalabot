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

/*
 * Modules
 * Contains the entire module API
 */

function apiSetup() {
    // Checking for mods folder, creating if not found
    try { fs.accessSync( `${execPath}\\mods` ); }
    catch (e) { fs.mkdirSync( `${execPath}\\mods` ); }

    // Adding mods to the program
    
    fs.readdir(`${execPath}\\mods`, function(err, files){
        var output = "";
        for ( var f = 0; f < files.length; f++ ) {
            if ( files[f].split(".")[1] == "js" ) {
                output += `<script type="text/javascript" src="${apiGetPath() + files[f]}"></script>`;
            }
        }
        $("head").append( output );
    } );
}

/**
 * Adds a command, makes it lower case
 * @param {string} keyword - The !command a user types in
 * @param {string} functionName - What function to call. It sends: params (array), from (string), mod (boolean), subscriber (boolean)
 * @return {Boolean} True if success, false if fail
 */
function apiAddCmd(keyword, functionName) {
    try {
        cmdList.push({ cmd: keyword.toLowerCase(), func: functionName });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Adds a module
 * @param {string} moduleName - the name of the module
 * @return {string} the id of the page to $().prepend/.html/.append
 */
function apiAddTab(moduleName) {

    moduleName.replace(/"/g, ""); // removes quotation marks to prevent breaking

    // creates a new tab in the modules dropdown
    $("#moduleMenu").append(`
        <li><a href="#tab-module-${moduleName}" data-toggle="tab">
        ${moduleName}
        </a></li>`);

    // creates the pane
    $("#pageContent").append(`
        <div class="tab-pane" id="tab-module-${moduleName}">
        </div>
    `);

    return `#tab-module-${moduleName}`;
}

/**
 * Writes to the chat
 * @param {string} text - The text to say in the chat
 */
function apiSay(text) {
    bot.say( settings.channel, text );
    log( `<b>[+] ${text}</b>` );
}

/**
 * Returns the path
 * @return {string} path to the mods folder, including trailing slash
 */
function apiGetPath() {
    return `${execPath}\\mods\\`;
}

/**
 * Returns the channel (and thus likely the streamer's) name
 * @return {string} the channel name
 */
function apiGetChannelName() {
    return settings.channel.substring(1);
}

/**
 * Returns the bot name
 * @return {string} the bot name
 */
function apiGetBotName() {
    return settings.username;
}

/**
 * Returns the number of points a user has
 * @param {string} username
 * @return {integer} -1 if not found, otherwise the amount of points of the user
 */
function apiGetPoints(username) {
    var index = getPointIndex(username);
    if ( index == -1 ) {
        return -1;
    }
    return pointsSettings.users[index].currentPoints;
}

/**
 * Sets the points a user has
 * @param {string} username
 * @param {integer} points
 * @return {integer} -1 if not found, otherwise the amount of points of the user
 */
function apiSetPoints(username, points) {
    var index = getPointIndex(username);
    if ( index == -1 ) {
        return -1;
    }
    pointsSettings.users[index].currentPoints = points;
    save();
    drawList();
    return pointsSettings.users[index].currentPoints;
}

