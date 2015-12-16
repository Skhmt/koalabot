//timedMessages.js

var timedMessages = [];

function timedMessagesSetup(){
	
	try {
		var readFile = fs.readFileSync(execPath + "\\settings\\timedMessages.ini");
		timedMessages = $.parseJSON( readFile );
	} catch(e) { // if there isn't a timedMessages.ini, just use the default settings
		timedMessages = [];
	}

	$("#addMsgButton").button().click(function(){
		addMessage();
	});
	
	refreshMessages();
}

function refreshMessages(){
	// clear the timedMsgs area
	$("#timedMsgs").html("");
	
	// clear the timerList
	timerList = [];
	
	for (var i = 0; i < timedMessages.length; i++){
		var output = "";
		// build a message... [X] [Time] [Message]
		output += "<button id='msg" + i + "' class='msgDeleteButton' onclick='deleteMessage(" + i + ")'>delete</button> ";
		output += "<span class='timedMessageSpan'>" + timedMessages[i].time + "s</span> ";
		output += timedMessages[i].text + "<br />";
		
		// add the message to the ui list of messages
		$("#timedMsgs").append(output);
		
		// style the button
		$("#msg"+i).button({
			icons: {
				primary: "ui-icon-closethick"
			},
			text: false
		});
		
		// create an interval
		//var intervalId = setInterval(playMessage(i), timedMessages[i].time * 1000);
		
		// add the message to timedMessagesIntervals
		var now = new Date().getTime();
		var tempInterval = timedMessages[i].time * 1000;
		timerList.push({
			message: timedMessages[i].text,
			playTime: now + tempInterval,
			interval: tempInterval
		});
	}
}

function addMessage(){
	// add the message
	var tempText = $("#addMsgText").val();
	var tempTime = $("#addMsgTime").val();
	
	if(tempText == ""){
		alert("Error: no text entered.");
	} else if ( tempTime != parseInt(tempTime, 10) ) {
		alert("Error: time should be a number.");
	} else if ( tempTime <= 0){
		alert("Error: time must be greater than 0 seconds.");
	} else {
		timedMessages.push({
			text: tempText,
			time: tempTime
		});
		save();
		
		// clear the fields
		$("#addMsgText").val("");
		$("#addMsgTime").val("120");
		
		refreshMessages();
	}
}

function deleteMessage(id){
	if ( confirm("Are you sure you want to delete \"" + timedMessages[id].text + "\" ?") ){
		timedMessages.splice(id, 1);
		save();
		refreshMessages();
	}
}