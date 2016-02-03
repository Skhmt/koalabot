
/*
  Example module
  To install modules, just place them in the /mods folder with the .js extension.
  jQuery 2.2.0 and Bootstrap 3.3.6 are included, but bootstrap glyphicons are not enabled
  Name all functions, ids, and global variables as: mod[your mod name][description of the function]
 */

// Run the setup for your mod.
modExampleSetup();

// This is the intial setup of the mod
function modExampleSetup() {

	// Creates an entry in the Modules tab and creates a page based on the name you give it
	// If your module doesn't need a UI and only adds commands, you don't have to do this.
	var myTab = apiAddTab("example");

	// Fills out the page via bootstrap. As you can see, ES6 Template Strings are allowed. You have a lot of freedom here.
	$(myTab).html(`
		<div class="row-fluid">
			<div class="col-sm-12">
				<div class="panel panel-info">
					<div class="panel-heading">
						<h2 class="panel-title">This is an example module.</h2>
					</div>
					<div class="panel-body">
						<p>
							Please see the source for more details on how to make a module for KoalaBot.
						</p>
						<p>
							The source is located at /mods/example.js and can be opened with any text editor.
						</p>
					</div>
					<ul class="list-group">
						<li class="list-group-item">
							The mod path is: ${apiGetPath()} - this is useful for loading images or music
						</li>
						<li class="list-group-item">
							Run !examplecmd for an example command
						</li>
						<li class="list-group-item">
							Bot name: ${apiGetBotName()}
						</li>
						<li class="list-group-item">
							Channel/streamer name: ${apiGetChannelName()}
						</li>
						<li class="list-group-item">
							The number of points of skhmt: ${apiGetPoints('skhmt')}
						</li>
						<li class="list-group-item">
							Setting the number of points of abcdefg to 10: ${apiSetPoints('abcdefg', 10)}
						</li>
					</ul>
				</div>
			</div>
		</div>`);

	// Adds the command "!examplecmd" that runs the function modExampleCmd when invoked in the chat
	// Commands are case insensitive
	apiAddCmd("examplecmd", "modExampleCmd");
}

// All custom commands need to be in their own function and take these 4 parameters:
// params (array) - every word after the command keyword is in its own item of the array
// from (string) - the username of the person that invoked the command keyword in the chat
// mod (boolean) - true if the user is a moderator
// subscriber (boolean) - true if the user is a subscriber
function modExampleCmd(params, from, mod, subscriber) {
	apiSay(`This is an example command, ${from}.`);
}