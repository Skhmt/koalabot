
var viewerData = [];

function statsSetup(){
	$("#openViewerGraph").button().click(function(){
		drawGraph();
		$("#graphDialog").dialog("open");
	});

	$("#newViewers").button().click(function(){
		var tempPath = execPath + "\\logs\\viewerStats-";
		tempPath += viewerData[0].d.substring(0,10) + "_";
	
		var tempdate = viewerData[0].d.substring(11); // 22:23:00
		tempdate = tempdate.split(":");
		tempdate = tempdate.join("-")
		
		tempPath += tempdate;
		tempPath += ".log";
		
		fs.writeFileSync(tempPath, JSON.stringify(viewerData));
		
		viewerData = [];
		saveViewerData();
	});
	
	try {
		var readFile = fs.readFileSync(execPath + "\\logs\\viewerStats.log");
		var data = $.parseJSON( readFile );
		viewerData = data;
	} catch (e){
		viewerData = [];
		saveViewerData();
	}
}

function exportViewers(viewers){
	var dateNow = new Date();
	
	var tempTime = dateNow.toTimeString();
	//ex: 16:48:11 GMT-0800 (Pacific Standard Time)
	
	var pushObj = {
		"d": "",
		"v": 0,
	}
	
	var tempMonth = dateNow.getMonth();
	if (tempMonth < 10) tempMonth = "0" + tempMonth;
	var tempDay = dateNow.getDate();
	if (tempDay < 10) tempDay = "0" + tempDay;
	
	pushObj.d= dateNow.getFullYear() + "-" + tempMonth + "-" + tempDay + " " + tempTime.substring(0,8);
	pushObj.v = viewers;
	
	viewerData.push(pushObj);
	
	saveViewerData();
}

function drawGraph(){
	
	var tempX = [];
	var tempY = [];
	
	for (var i = 0; i < viewerData.length; i++) {
		tempX.push(viewerData[i].d);
		tempY.push(viewerData[i].v);
	}
	
	var graphData = [
		{
			x: tempX,
			y: tempY,
			type: "scatter"
		}
	];
	
	Plotly.newPlot("graph", graphData);
}

function saveViewerData() {
	fs.writeFileSync(execPath + "\\logs\\viewerStats.log", JSON.stringify(viewerData));
}



/*
var data = [
  {
    x: ['2013-10-04 22:23:00', '2013-11-04 22:23:00', '2013-12-04 22:23:00'],
    y: [1, 3, 6],
    type: 'scatter'
  }
];

Plotly.newPlot('myDiv', data);
*/