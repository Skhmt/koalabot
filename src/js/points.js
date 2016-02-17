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
		drawList();
	} catch(e) { // if there isn't a modSettings.ini, just use the default settings
		pointsSettings = {
			enabled: true,
			unit: "points",
			regularPoints: 999999,
			pointsPerUpdate: 1,
			minutesPerUpdate: 1,
			users: [], // {username: string, totalPoints: int, currentPoints: int }
			ranks: [] // {name: string, points: int}
		};
	}

	$("#pointUnits").val( pointsSettings.unit );
	$("#pointUnits").on( "input", function() {
		pointsSettings.unit = this.value;
		save();
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
		save();
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
		save();
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
		save();
	} );

	$("#addUserPointsButton").click(function(){
		pointsSettings.users.push( {
			username: $("#addUserPointsText").val(),
			totalPoints: 0,
			currentPoints: 0
		} );
		$("#addUserPointsText").val("")
		save();
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


	var startTime = new Date();

	var pointsWorker = new Worker("js/worker-points.js");
	pointsWorker.postMessage([currentUsers, pointsSettings.users, pointsSettings.pointsPerUpdate]);

	pointsWorker.onmessage = function(e) {
		pointsSettings.users = e.data;

		save();
		drawList();

		var endTime = new Date();
		console.log(`update points: ${endTime.getTime() - startTime.getTime()}ms`);
	}
}

function updateLifePoints() {

	if ( !pointsSettings.enabled ) return;

	if ( currentUsers.length == 0 || pointsSettings == null ) {
		return;
	}


	var startTime = new Date();

	var pointsWorker = new Worker("js/worker-lifetime.js");
	pointsWorker.postMessage([currentUsers, pointsSettings.users, pointsSettings.pointsPerUpdate]);

	pointsWorker.onmessage = function(e) {
		pointsSettings.users = e.data;

		save();
		drawList();

		var endTime = new Date();
		console.log(`update life: ${endTime.getTime() - startTime.getTime()}ms`);
	}
}

//function updateLifePoints() {
//
//	if ( !pointsSettings.enabled ) return;
//
//	var startTime = new Date();
//
//	if ( currentUsers.length == 0 || pointsSettings == null ) {
//		return;
//	}
//
//	var newUserArray = [];
//
//	for ( var c = 0; c < currentUsers.length; c++ ) { // for each user currently in the chat room...
//		var currentLC = currentUsers[c].username.toLowerCase();
//
//		var theIndex;
//	 	if ( pointsSettings.users.length > 0 ) {
//			theIndex = binarySearch( currentLC , pointsSettings.users, 0 );
//		}
//		else {
//			theIndex = -1;
//		}
//
//		if ( theIndex == -1 ) {
//			newUserArray.push( {
//				username: currentUsers[c].username,
//				totalPoints: 1,
//				currentPoints: pointsSettings.pointsPerUpdate
//			} );
//		}
//		else {
//			pointsSettings.users[theIndex].totalPoints += 1;
//		}
//	}
//
//	if ( newUserArray.length > 0 ) {
//		pointsSettings.users = pointsSettings.users.concat(newUserArray);
//		pointsSettings.users = sortList(pointsSettings.users);
//	}
//	save();
//	drawList();
//
//	var endTime = new Date();
//	console.log(`update life points: ${endTime.getTime() - startTime.getTime()}ms`);
//}

function sortList(theArray) {
	theArray.sort( function( a, b ) {
		if ( a.username < b.username )
			return -1;
		else if ( a.username > b.username )
			return 1;
		else
			return 0;
	} );

	return theArray;
}

// temparray is initially pointsSettings.users
// searchname is already lowercase
function binarySearch(searchname, searcharray, indexoffset) {
	var temparray = [];
	temparray = temparray.concat(searcharray);

	var index = Math.floor( (temparray.length - 1) / 2);

	if (!temparray[index]) {
		return -1;
	}

	var arrayname = temparray[index].username.toLowerCase();

	if ( searchname === arrayname ) { // found
		return (indexoffset + index);

	}
	else if ( searchname > arrayname && temparray.length >= 1) {
		var newarray = temparray.splice( index + 1, Number.MAX_VALUE );
		return binarySearch( searchname, newarray, (indexoffset + index + 1) );

	} else if ( searchname < arrayname && temparray.length >= 1) {
		var newarray = temparray.splice( 0, index );
		return binarySearch( searchname, newarray, indexoffset );

	} else {
		return -1;
	}
}

function drawList() {
	var output = "";
	output += `
		<table class="table table-striped table-hover table-condensed">
		<tr>
			<th class="col-sm-5">Username</th>
			<th class="col-sm-2">${pointsSettings.unit}</th>
			<th class="col-sm-2">Hours</th>
			<th class="col-sm-3">Actions</th>
		</tr>`;

	var beginning = $("#pointsListText").val().toLowerCase();
	if (!beginning) {
		output += `</table>`;
		$("#pointsList").html( output );
		return;
	}

	var regex = new RegExp("^" + beginning);

	for ( var i = 0; i < pointsSettings.users.length; i++ ) {
		var username = pointsSettings.users[i].username;
		if ( regex.test(username.toLowerCase()) ) {
			output += `<tr>
					<td>${username}</td>
					<td>${pointsSettings.users[i].currentPoints}</td>
					<td>${(pointsSettings.users[i].totalPoints/60.0).toFixed(2)}</td>
					<td>
						<button class="btn btn-success btn-xs" onclick="addPoint(${i}, 5)">+5</button>
						<button class="btn btn-info btn-xs" onclick="addPoint(${i}, 1)">+1</button>
						<button class="btn btn-warning btn-xs" onclick="subtractPoint(${i}, 1)">&ndash;1</button>
						<button class="btn btn-danger btn-xs" onclick="subtractPoint(${i}, 5)">&ndash;5</button>
						&nbsp;&nbsp;
						<button class="btn btn-danger btn-xs" onclick="deletePoints(${i})">
							<span class="glyphicon glyphicon-remove"></span>
						</button>
					</td>
				</tr>`;
		}
	}

	output += `</table>`;
	$("#pointsList").html( output );
}

function addPoint( index, amount ) {
	pointsSettings.users[index].currentPoints += amount;
	save();
	drawList();
}

function subtractPoint( index, amount ) {
	pointsSettings.users[index].currentPoints -= amount;
	save();
	drawList();
}

function getPointIndex( name ) {
	var nameLC = name.toLowerCase();
	for ( var i = 0; i < pointsSettings.users.length; i++ ) {
		if ( nameLC === pointsSettings.users[i].username ) {
			return i;
		}
	}
	return -1;
}

function cmdPoints( params, from, mod, subscriber ) {
	if ( !pointsSettings.enabled ) return;

	var theIndex = getPointIndex( from );
	if ( theIndex == -1 ) {
		cmdSay(`${from} has no points.`);
	}
	else {
		var points = pointsSettings.users[theIndex].currentPoints;
		cmdSay(`${from} has ${points} ${pointsSettings.unit}.`);
	}
}

function deletePoints( index ) {
	pointsSettings.users.splice(index, 1);
	save();
	drawList();
}
