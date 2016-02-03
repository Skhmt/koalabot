### apiAddCmd(keyword, functionName) 

Adds a command, makes it lower case. It will call the function name you send it.
The function will be given these parameters: params (array), from (string), mod (boolean), subscriber (boolean)

**Parameters**

**keyword**: `String`, The !command a user types in

**functionName**: `String`, What function to call.

**Returns**: `Boolean`, True if success, false if fail


### apiAddTab(moduleName) 

Adds a module to the dropdown and creates a page.
If the module only adds commands and doesn't require a user interface, this doesn't need to be used.

**Parameters**

**moduleName**: `String`, the name of the module

**Returns**: `String`, the id of the page to $(id).prepend / $(id).html / $(id).append


### apiSay(text) 

Writes to the chat. It outputs as [+] to show it's a module rather than [!] that the base bot uses.

**Parameters**

**text**: `String`, The text to say in the chat


### apiLog(text) 

Only outputs to the chatlog and your chat window, but does not send a chat message for others to see. It is used to notify the streamer of things.

**Parameters**

**text**: `String`, The text to log


### apiGetPath() 

Gets the path to the mods folder, ex:  C:\bot\mods\

**Returns**: `String`, path to the mods folder, including trailing slash


### apiGetChannelName() 

Gets the channel name, which is likely also the streamer's name.

**Returns**: `String`, the channel name


### apiGetBotName() 

Gets the bot name.

**Returns**: `String`, the bot name


### apiGetPoints(username) 

Gets the number of points a user has.

**Parameters**

**username**: `String`, case insensitive

**Returns**: `integer`, null if not found, otherwise the amount of points of the user


### apiSetPoints(username, points) 

Sets the points a user has.

**Parameters**

**username**: `String`, case insensitive

**points**: `integer`, what to set the user's points to

**Returns**: `integer`, null if not found, otherwise the amount of points of the user


### apiModPoints(username, points) 

Modifies the points a user has.

**Parameters**

**username**: `String`, case insensitive

**points**: `integer`, what to add to the uesr's points. To subtract, send a negative number

**Returns**: `integer`, null if not found, otherwise the amount of points of the user


### apiOpenFile(filename) 

Opens a file in the \mods\ directory.
To load an object, do something like:  $.parseJSON( apiOpenFile("modExampleSettings.ini") );

**Parameters**

**filename**: `String`, case sensitive, the path to the \mods\ directory is included

**Returns**: `String`, the file contents, null if it doesn't exist


### apiAppendFile(filename, text) 

Appends a new line of text to the end a file in the \mods\ directory.
If a file isn't found, it will automatically be created, then appended to.

**Parameters**

**filename**: `String`, case sensitive, the path to the \mods\ directory is included

**text**: `String`, what to add to the contents of the file

**Returns**: `string`, true if success, false if fail


### apiWriteFile(filename, text) 

Writes a file in the \mods\ directory. This will completely over-write an existing file.
To save an object, do something like:  apiWriteFile( "modExampleSettings.ini", JSON.stringify( modExampleSettings ) );

**Parameters**

**filename**: `String`, case sensitive, the path to the \mods\ directory is included

**text**: `String`, what to make the contents of the file

**Returns**: `Boolean`, true if success, false if fail
