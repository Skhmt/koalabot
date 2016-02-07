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

var viewerData = [];

function statsSetup() {
	$("#openStats").click(drawGraph);

	$("#newViewers").click( function() {
		var tempPath = `${execPath}logs/viewerStats-${viewerData[0].d.substring(0,10)}_`;

		var tempdate = viewerData[0].d.substring(11); // 22:23:00
		tempdate = tempdate.split( ":" );
		tempdate = tempdate.join( "-" );

		fs.writeFileSync( `${tempPath + tempdate}.log`, JSON.stringify( viewerData ) );

		viewerData = [];
		saveViewerData();

		$("#graph").html("");
		drawGraph();
	} );
	
	try {
		var readFile = fs.readFileSync( `${execPath}logs/viewerStats.log` );
		var data = $.parseJSON( readFile );
		viewerData = data;
	} catch (e) {
		viewerData = [];
		saveViewerData();
	}
}

function exportViewers( viewers ) {
	var dateNow = new Date();
	
	var tempTime = dateNow.toTimeString();
	//ex: 16:48:11 GMT-0800 (Pacific Standard Time)
	
	var pushObj = {
		"d": "",
		"v": 0,
	}
	
	var tempMonth = dateNow.getMonth() + 1;
	if ( tempMonth < 10 ) tempMonth = "0" + tempMonth;
	var tempDay = dateNow.getDate();
	if ( tempDay < 10 ) tempDay = "0" + tempDay;
	
	pushObj.d = `${dateNow.getFullYear()}-${tempMonth}-${tempDay} ${tempTime.substring( 0, 8 )}`;
	pushObj.v = viewers;
	
	viewerData.push( pushObj );
	
	saveViewerData();
}

function drawGraph() {
	
	var tempX = [];
	var tempY = [];
	
	for ( var i = 0; i < viewerData.length; i++ ) {
		tempX.push( viewerData[i].d );
		tempY.push( viewerData[i].v );
	}
	
	var graphData = [
		{
			x: tempX,
			y: tempY,
			type: "scatter",
			fillcolor: "white",
		}
	];

	var layout = {
		width: 730,
		height: 460,
		margin: {
			l: 60,
			r: 60,
			t: 60,
			b: 60
		},
		paper_bgcolor: "white",
		plot_bgcolor: "#DDDDDD",
		yaxis: {title: "viewers"},
		font: {
			color: "black"
		}
	};
	
	Plotly.newPlot( "graph", graphData, layout );
}

function saveViewerData() {
	fs.writeFile( `${execPath}logs/viewerStats.log`, JSON.stringify( viewerData ), function ( err ) {
		if ( err ) log( "* Error saving viewer data" );
	} );
}