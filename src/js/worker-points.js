/**
 * Created by Skhmt on 16-Feb-16.
 */


// [currentUsers, pointsSettings.users, pointsSettings.pointsPerUpdate]

onmessage = function(e) {

    var currentUsers = e.data[0];
    var users = e.data[1];
    var pointsPerUpdate = e.data[2];

    var newUserArray = [];

    for ( var c = 0; c < currentUsers.length; c++ ) { // for each user currently in the chat room...
        var currentLC = currentUsers[c].username.toLowerCase();

        var theIndex;
        if ( users.length > 0 ) {
            // theIndex = binarySearch( currentLC, users, 0 );
			theIndex = forSearch( currentLC, users );
        }
        else {
            theIndex = -1;
        }

        if ( theIndex == -1 ) {
            newUserArray.push( {
                username: currentUsers[c].username,
                totalPoints: 1,
                currentPoints: pointsPerUpdate
            } );
        }
        else {
            users[theIndex].currentPoints += pointsPerUpdate;
        }
    }

    if ( newUserArray.length > 0 ) {
        users = users.concat(newUserArray);
        users = sortList(users);
    }


    postMessage(users);
    close();
}

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

function forSearch(searchword, searcharray) {
	for ( var i = 0; i < searcharray.length; i++ ) {
		searchname = searcharray[i].username.toLowerCase();
		if ( searchword == searchname ) {
			return i;
		}
		if ( searchword < searchname ) {
			return -1;
		}
	}
	return -1;
}

// temparray is initially pointsSettings.users
// searchname is already lowercase
// function binarySearch(searchname, searcharray, indexoffset) {
//     var temparray = [];
//     temparray = temparray.concat(searcharray);
//
//     var index = Math.floor( (temparray.length - 1) / 2);
//
//     if (!temparray[index]) {
//         return -1;
//     }
//
//     var arrayname = temparray[index].username.toLowerCase();
//
//     if ( searchname === arrayname ) { // found
//         return (indexoffset + index);
//
//     }
//     else if ( searchname > arrayname && temparray.length >= 1) {
//         var newarray = temparray.splice( index + 1, Number.MAX_VALUE );
//         return binarySearch( searchname, newarray, (indexoffset + index + 1) );
//
//     } else if ( searchname < arrayname && temparray.length >= 1) {
//         var newarray = temparray.splice( 0, index );
//         return binarySearch( searchname, newarray, indexoffset );
//
//     } else {
//         return -1;
//     }
// }
