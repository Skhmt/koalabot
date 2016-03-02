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

var pointsSettings;

function pointsSetup() {

	try {
		var readFile = fs.readFileSync( `${execPath}settings/pointsSettings.ini` );
		pointsSettings = $.parseJSON( readFile );

		var tempUserArray = [];
		for ( var i = 0; i < pointsSettings.users.length; i++ ) {
			var tempuser = pointsSettings.users[i];
			tempUserArray[tempuser.username] = {
				totalPoints: tempuser.totalPoints,
				currentPoints: tempuser.currentPoints
			};
		}
		pointsSettings.users = tempUserArray;

		drawList();
	} catch(e) { // if there isn't a modSettings.ini, just use the default settings
		pointsSettings = {
			enabled: true,
			unit: "points",
			regularPoints: 30*60,
			pointsPerUpdate: 1,
			minutesPerUpdate: 1,
			ranks: [], // {name: string, points: int}
			users: [] // {username: string, totalPoints: int, currentPoints: int }
		};
	}

	$("#regularPoints").val( parseInt(pointsSettings.regularPoints / 60) );
	$("#regularPoints").on( "input", function() {
		pointsSettings.regularPoints = this.value * 60;
	} );

	$("#pointUnits").val( pointsSettings.unit );
	$("#pointUnits").on( "input", function() {
		pointsSettings.unit = this.value;
		drawList();
	} );

	$("#pointsPointUpdate").val( pointsSettings.pointsPerUpdate );
	$("#pointsPointUpdate").on( "input", function() {
		if ( this.value < 0 ) {
			pointsSettings.pointsPerUpdate = 0;
			$("#pointsPointUpdate").val( 0 );
		} else {
			pointsSettings.pointsPerUpdate = Number( this.value );
		}
	} );

	$("#pointsMinuteUpdate").val( pointsSettings.minutesPerUpdate );
	$("#pointsMinuteUpdate").on( "input", function() {
		if ( this.value < 0 ) {
			pointsSettings.minutesPerUpdate = 0;
			$("#pointsMinuteUpdate").val( 0 );
		} else {
			pointsSettings.minutesPerUpdate = Number( this.value );
		}
		timerSettings.pointsInterval = pointsSettings.minutesPerUpdate*60*1000;
	} );

	if ( pointsSettings.enabled ) {
		$("#pointsOn").prop( "checked", true );
		$("#pointsOn").parent().addClass("active");
	} else {
		$("#pointsOff").prop( "checked", true );
		$("#pointsOff").parent().addClass("active");
	}

	$("input[name='pointsRadio']").change( function() {
		if ( this.value === "on" ){
			pointsSettings.enabled = true;
		} else {
			pointsSettings.enabled = false;
		}
	} );

	$("#addUserPointsButton").click(function(){
		pointsSettings.users[$("#addUserPointsText").val()] = {
			totalPoints: 1,
			currentPoints: pointsSettings.pointsPerUpdate
		};
		$("#addUserPointsText").val("")
		drawList();
	} );

	$("#pointsListText").on( "input", function() {
		drawList();
	} );
}

// currentUsers = []; {"username": tempuser, "role": staff/moderator/admin/globalmod/viewer}
// this is automatically run every 60 seconds
function updatePoints() {

	if ( !pointsSettings.enabled ) return;

	if ( currentUsers.length == 0 || pointsSettings == null ) {
		return;
	}


	var startTime = $.now();

	for ( var c = 0; c < currentUsers.length; c++ ) { // for each user currently in the chat room...
        var currentLC = currentUsers[c].username.toLowerCase();

		if ( pointsSettings.users[currentLC] ) {
			pointsSettings.users[currentLC].currentPoints += pointsSettings.pointsPerUpdate;
		}
		else {
			pointsSettings.users[currentLC] = {
				totalPoints: 1,
				currentPoints: pointsSettings.pointsPerUpdate
			}
		}
    }
	console.log(`update points: ${$.now() - startTime}ms`);
}

function updateLifePoints() {

	if ( !pointsSettings.enabled ) return;

	if ( currentUsers.length == 0 || pointsSettings == null ) {
		return;
	}


	var startTime = $.now();

	for ( var c = 0; c < currentUsers.length; c++ ) { // for each user currently in the chat room...
        var currentLC = currentUsers[c].username.toLowerCase();

		if ( pointsSettings.users[currentLC] ) {
			pointsSettings.users[currentLC].totalPoints += 1;
		}
		else {
			pointsSettings.users[currentLC] = {
				totalPoints: 1,
				currentPoints: pointsSettings.pointsPerUpdate
			}
		}
    }
	console.log(`update life: ${$.now() - startTime}ms`);
}

function drawList() {
	var output = "";
	output += `
		<table class="table table-striped table-hover table-condensed">
		<tr>
			<th class="col-sm-5 col-lg-8">Username</th>
			<th class="col-sm-2 col-lg-1">${pointsSettings.unit}</th>
			<th class="col-sm-2 col-lg-1">Hours</th>
			<th class="col-sm-3 col-lg-2">Actions</th>
		</tr>`;

	var beginning = $("#pointsListText").val().toLowerCase();
	beginning = beginning
		.replace(/\\/g, '')
		.replace(/\//g, '')
		.replace(/\*/g, '')
		.replace(/\+/g, '')
		.replace(/\?/g, '')
		.replace(/\{/g, '')
		.replace(/\}/g, '')
		.replace(/\$/g, '')
		.replace(/\^/g, '')
		.replace(/\./g, '');

	if ( !beginning || beginning.length < 2 ) {
		output += `</table>`;
		$("#pointsList").html( output );
		return;
	}

	var regex = new RegExp("^" + beginning);

	var keyList = Object.keys( pointsSettings.users );

	for ( var i = 0; i < keyList.length; i++ ) {
		var username = keyList[i];
		//if ( username.toLowerCase().startsWith(beginning) ) {
		if ( regex.test(username) ) {
			output += `<tr>
					<td>${username}</td>
					<td>${pointsSettings.users[username].currentPoints}</td>
					<td>${(pointsSettings.users[username].totalPoints/60.0).toFixed(2)}</td>
					<td>
						<button class="btn btn-success btn-xs" onclick="addPoint('${username}', 5)">+5</button>
						<button class="btn btn-info btn-xs" onclick="addPoint('${username}', 1)">+1</button>
						<button class="btn btn-warning btn-xs" onclick="subtractPoint('${username}', 1)">&ndash;1</button>
						<button class="btn btn-danger btn-xs" onclick="subtractPoint('${username}', 5)">&ndash;5</button>
						&nbsp;&nbsp;
						<button class="btn btn-danger btn-xs" onclick="deletePoints('${username}')">
							<span class="glyphicon glyphicon-remove"></span>
						</button>
					</td>
				</tr>`;
		}
	}

	output += `</table>`;
	$("#pointsList").html( output );
}

function addPoint( name, amount ) {
	pointsSettings.users[name].currentPoints += amount;
	drawList();
}

function subtractPoint( name, amount ) {
	pointsSettings.users[name].currentPoints -= amount;
	drawList();
}

function cmdPoints( params, from ) {
	if ( !pointsSettings.enabled ) return;

	var nameLC = from.toLowerCase();

	if ( !pointsSettings.users[nameLC] ) {
		cmdSay(`${from} has no points.`);
	}
	else {
		var points = pointsSettings.users[nameLC].currentPoints;
		cmdSay(`${from} has ${points} ${pointsSettings.unit}.`);
	}
}

function deletePoints( name ) {

	var nameLC = name.toLowerCase();

	delete pointsSettings.users[nameLC];
	drawList();
}
