 // (c) Art Kho 2009
//
//
// This file references functions and objects found in crockford.js and
// lgpl.js
//
window.artxgj = window.artxgj || {};
artxgj.maps = artxgj.maps || {};
artxgj.h5run = artxgj.h5run || {};


/*
 * Stuff borrowed from Crockford's "Javascript: The Good Parts"
 */

if (typeof Object.create !== 'function') {
    Object.create = function(o) {
        var F = function () {};
        F.prototype = o;
        return new F();
    };
}


// p. 33
Function.prototype.method = function (name, func) {
    if (!this.prototype[name]) {
        this.prototype[name] = func;
        return this;
    }
};

String.method('trim', function () {
    return this.replace(/^\s+|\s+$/g,'');
});


// p. 61
var is_array = function (value) {
    return Object.prototype.toString.apply(value) === '[object Array]';
};


// p. 63-64
Array.dim = function (dimension, initial) {
    var a = [], i;
    for (i = 0; i  < dimension; i += 1) {
        a[i] = initial;
    }
    return a;
};

Array.matrix = function (m, n, initial) {
    var a, i, j, mat = [];
    for (i=0; i < m; i += 1) {
        a = [];
        for (j=0; j < n; j += 1) {
            a[j] = initial;
        }
        mat[i] = a;
    }
    return mat;
};

// p. 104
var isObject = function (object) {
    return object && typeof object === 'object';
};

// p. 105
var isNumber = function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
};


//My own extensions
Number.method('meterToMile', function () {
    return this * 0.000621371192237334;
});


Number.method('meterToKm', function () {
    return this * 0.001;
});


Number.method('kmToMile', function () {
    return this * 0.621371192237334;
});


Number.method('kmToMeter', function () {
    return this * 1000;
});


Number.method('mileToMeter', function () {
    return this * 1609.344;
});


Number.method('mileToKm', function () {
    return this * 1.609344;
});


Number.method('toChronoString', function () {
    var duration = this/1000,
        hour = Math.floor( (duration / 3600) ),
        min = Math.floor( (duration - hour * 3600)/60),
        sec = Math.round(duration - (hour*3600) - (min*60));

    if (sec === 60) {
        min += 1;
        sec = 0;
    }

    if (min === 60) {
        hour += 1;
        min = 0;
    }


    if ( min < 10 && hour > 0)  {
        min = '0' + min;
    }

    if ( sec < 10) {
        sec = '0' + sec;
    }


    return (hour > 0 ? hour + ':' : '') + min + ":" + sec ;

});


Number.method('toRunPaceString', function () {
    // returns minute/distance unit

    var min = Math.floor(this);
    var sec = Math.round( (this - Math.floor(this))*60);

    if (sec === 60) {
        min += 1;
        sec = 0;
    }

    return min + ":" + (sec < 10 ? '0' + sec : sec);
});


function parseDataSourceURL() {
    var queryStringIndex = document.URL.indexOf("?") + 1;


    return (queryStringIndex > 0)
            ? document.URL.substring(queryStringIndex, document.URL.length)
            : null;
}


function iPhoneBrowserLayout() {
    var useragent = navigator.userAgent;

    if (useragent.indexOf('iPhone') != -1 ||
            useragent.indexOf('Android') != -1 ) {
       return;
    }
    else {
        // mimic iPhone browser for testing purposes
        $('body').width('320px');
        $('body').height('480px');
    }
}


function LocaleDTSDate(utc, tz) {

    return new Date(utc+3600000*tz);
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Vincenty Inverse Solution of Geodesics on the Ellipsoid (c) Chris Veness 2002-2009            */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/*
 * Calculate geodesic distance (in m) between two points specified by latitude/longitude
 * (in numeric degrees) using Vincenty inverse formula for ellipsoids
 */
function distVincenty(lat1, lon1, lat2, lon2) {
    // code removed, will contact Chris Veness for permission to include his function in my github repo
}

/*
 * extend Number object with methods for converting degrees/radians
*/
Number.prototype.toRad = function() {  // convert degrees to radians
  return this * Math.PI / 180;
};


// Factory is a singleton
artxgj.h5run.geolocationFactory = function () {

    var browserGeolocation = function () {
        // Firefox, Safari, Chrome, Chrome-frame
        if ( !navigator.geolocation ) {
            throw "W3C Geolocation API is not supported." +
                    "[artxgj.geolocationFactory.createGeolocation]";
        }
        return navigator.geolocation;

    };

    return {
        GEOSOURCE : { browser:1, url:2, localDB:3 },

        createGeolocation : function (geoSource) {
            if (geoSource === this.GEOSOURCE.browser) {
                return browserGeolocation();
            }
            else if (geoSource === this.GEOSOURCE.url) {
                return artxgj.h5run.geolocation();
            }
            else {
                throw "Incorrect geolocation source type [artxgj.geolocationFactory.createGEolocation";
            }

        }
    };
}();


//
// W3C Geolocation Implementation Section
// http://dev.w3.org/geo/api/spec-source.html
//

artxgj.h5run.Coordinates = function () {
    return {
        "latitude" : 0.0,
        "longitude" : 0.0,
        "altitude" : 0.0,
        "accuracy" : 0.0,
        "altitudeAccuracy" : 0.0,
        "heading" : 0.0,
        "speed" : 0.0
    };
};


artxgj.h5run.Position = function (spec) {

    return {
        timestamp : spec.timestamp,
        coords    : spec.coords,
        movestats : spec.movestats
    };
};



artxgj.h5run.PositionOptions = function () {

	// create PositionOptions object
    return {

        enableHighAccuracy : true, // optional
        timeout : 15000,           // milliseconds
        maximumAge: 0,
        resource : {
            url  : '',
            data : '',          // key-value pairs
            dataType : 'xml',   // other types for future version: json, jsonp
            timeout : 120000,
            completionCallback : null
        }
    };
};


artxgj.h5run.PositionError = function () {

    return {
        UNKNOWN_ERROR : 0,
        PERMISSION_DENIED : 1,
        POSITION_UNAVAILABLE : 2,
        TIMEOUT : 3,
        code : this.UNKNOWN_ERROR,
        message : '',
        isHTTP : true   // indicates that http error code was returned
    };
};


artxgj.h5run.isLocationServicesOff = function (error) {

    if (error.code === error.PERMISSION_DENIED &&
            error.message.toLowerCase() === 'unable to start') {
        return true;
    }

    return false;
};


artxgj.h5run.geolocationFnArgTest = function geolocationFnArgTest() {
    var callArgTypes = ['function', 'function', 'object'];
	var callArgKeys = ['successCallback', 'errorCallback', 'positionOptions'];
    var i;
    var numArgs = (arguments.length >= callArgTypes.length) ? callArgTypes.length : arguments.length;
    var fnArgs = {};

    if (arguments.length < 1) {
    	throw "TYPE_MISMATCH_ERR";
    }

    for (i = 0; i < numArgs; i++) {
    	if (typeof arguments[i] !== callArgTypes[i]) {
    		throw "TYPE_MISMATCH_ERR";
		}

		fnArgs[callArgKeys[i]] = arguments[i];
    }

    return fnArgs;
};



artxgj.h5run.geolocationURL = function () {

	var fnArgTest = artxgj.h5run.geolocationFnArgTest;

	function verifyOptions(options) {

        if (!options.dataType && options.dataType !== 'xml') {
            options.dataType = 'xml';  // default value
        }

        if (options.dataType === 'xml') {
            options.dataType = ($.browser.msie) ? "text" : "xml";
        }


        if (typeof options.data !== 'string') {
            options.data = '';
        }

        if (!isNumber(options.timeout) || options.timeout < 0) {
            options.timeout = 120000;  // 2 minutes
        }

    };

	function _watchPosition(){
	   	var args = fnArgTest.apply(this, arguments);
        var coords;
        var options;

        if (arguments.length === 3) {
        	options = arguments[2];
            verifyOptions(options);

            if (!options.resource.url || options.resource.url === '') {
                throw "options.resource.url is not supplied [artxgj.geolocation.watchPosition]";
            }
        }


        //
        // see http://docs.jquery.com/Ajax/jQuery.ajax
        $.ajax({
            type: "GET",
            url: options.resource.url,
            data : options.resource.data,
            dataType: options.resource.dataType,
            timeout : options.resource.timeout,
            success : function(data, textStatus) {

                var position, movestats, xml;
                var distance, duration;

                // see http://docs.jquery.com/Specifying_the_Data_Type_for_AJAX_Requests
                if (typeof data == "string") {
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = false;
                    xml.loadXML(data);
                } else {
                    xml = data;
                }

                $('geopoint', xml).each(function(i) {
                    coords = artxgj.h5run.Coordinates();
                    // add code to handle with missing elements
                    coords.latitude =
                        parseFloat($(this).find("latitude").text());
                    coords.longitude =
                        parseFloat($(this).find("longitude").text());
                    coords.altitude =
                        parseFloat($(this).find("altitude").text());
                    coords.accuracy =
                        parseFloat($(this).find("accuracy").text());
                    coords.altitudeAccuracy =
                        parseFloat($(this).find("altitudeAccuracy").text());
                    coords.heading =
                        parseFloat($(this).find("heading").text());
                    coords.speed =
                        parseFloat($(this).find("speed").text());

                    if ($(this).find("distance").text().length > 0) {
                        movestats = {};

                        movestats.distance =
                            parseFloat($(this).find("distance").text());

                        movestats.duration =
                            parseFloat($(this).find("duration").text());

                    }
                    else {
                        movestats = null;
                    }

                    position = artxgj.h5run.Position(
                            {
                                coords    : coords,
                                timestamp : parseFloat($(this).find("timestamp").text()),
                                movestats : movestats
                            }

                    );

                    args.successCallBack(position);
                });

            },

            error : function (xhr, textStatus, errorThrown) {

                var posError = artxgj.h5run.PositionError();

                try {

                    posError.code = xhr.status;
                    posError.message = textStatus;
                }
                catch (e) {
                    if (textStatus.toLowerCase() === 'timeout') {
                        posError.code = posError.TIMEOUT;
                    }
                    else {
                        posError.code = posError.AJAX_EXCEPTION;

                    }
                }
                posError.message = textStatus;

                if (args.errorCallback) {
                	args.errorCallback(posError);
                }
            },

            complete : function (xhr, textStatus) {
                try {
                    if (xhr.status === 200 &&
                            options.resource.completionCallBack()) {
                        options.resource.completionCallBack();
                    }
                } catch (e) {
                    // catch xhr exception (e.g., ajax timeout returns to
                    // this method with an invalid xhr)
                }
            }

        });

        return -1;
	}


    function _getCurrentPosition() {
        var args = fnArgTest.apply(this, arguments);

		args.successCallback();
	}


    function _clearWatch() {
    }

    return {
        watchPosition: function watchPosition() {
    		_watchPosition.apply(this,arguments);
        },
        getCurrentPosition : function getCurrentPosition() {
			_getCurrentPosition.apply(this, arguments);
        },

        clearWatch : function clearWatch() {
            // not implemented
        }

    };
};


//
// End of W3C Geolocation Implementation
//




artxgj.h5run.metersTracker = function () {
    var prevPosition = 0,
        distance = 0;

    return {
        add : function(position) {
            if (prevPosition) {
                distance += artxgj.h5run.distance(prevPosition,position);
            }

            prevPosition = position;
            return this;
        },
        get : function () {
            return distance;
        }
    };
};


artxgj.h5run.kmTracker = function () {
    var stats =artxgj.h5run.metersTracker();
    var distance = 0;

    return {
        add : function (position) {
            distance = (stats.add(position).get()).meterToKm();
            return this;
        },
        get : function () {
            return distance;
        }
    };
};


artxgj.h5run.milesTracker = function () {
    var stats =artxgj.h5run.metersTracker();
    var distance = 0;

    return {
        add : function (position) {
            distance = (stats.add(position).get()).meterToMile();
            return this;
        },
        get : function () {
            return distance;
        }
    };
};


artxgj.h5run.movementTracker = function (splitLength, unit) {

    var distance = 0;
    var nextSplit = 0;
    var duration = 0;
    var prevPosition;
    var movestate = {
        position : null,
        distance : 0,
        duration : 0,
        pace     : 0,
        split    : false,
        finished : false
    };

    splitLength = splitLength || 1;
    var distanceTracker;

    if (unit) {

        if (unit.toLowerCase() === 'mi') {
            distanceTracker = artxgj.h5run.milesTracker();
        }
        else if (unit.toLowerCase() === 'm') {
            distanceTracker = artxgj.h5run.metersTracker();

        }
        else {
            distanceTracker = artxgj.h5run.kmTracker();
        }

    }
    else {
        distanceTracker = artxgj.h5run.kmTracker();

    }
    return {

        // get and add both return an object containing these literal-pairs:
        //   position : current_position,
        //   distance : cumulative_distance,
        //   duration : cumulative_duration
        //   pace     : cumulative_pace
        //   split    : true - reached or passed split
        //   finished : true - reached finished line

        add : function (position) {

            movestate.position = position;
            movestate.split = false;
            movestate.finished = false;
            movestate.distance = distanceTracker.add(position).get();

            if (prevPosition) {
                duration += position.timestamp - prevPosition.timestamp;
                movestate.duration = duration;

                movestate.pace = duration/60000/ movestate.distance;
            }
            else {
                movestate.duration = 0;
                movestate.pace = 0;
            }

            if (movestate.distance >= nextSplit) {
                movestate.split = true;
                nextSplit += splitLength;
            }

            prevPosition = position;
            return movestate;
        },

        get : function () {

            return movestate;
        }
    };
};


artxgj.h5run.distance = function (prevPosition, position) {

    var srclat = prevPosition.coords.latitude;
    var srclon = prevPosition.coords.longitude;
    var destlat = position.coords.latitude;
    var destlon = position.coords.longitude;

    return parseFloat(distVincenty(srclat, srclon, destlat, destlon));

};


artxgj.h5run.filterAccuracy = function (gpsMaxAccuracy) {

    if (gpsMaxAccuracy <= 0) {
        throw "accuracy threshold must be > 0 [artxgj.h5run.filterAccuracy]";
    }

    if (!isNumber(gpsMaxAccuracy)) {
        gpsMaxAccuracy = 150;
    }
    return {
        pass : function (position) {

            return position.coords.accuracy <= gpsMaxAccuracy;
        }
    };

};


artxgj.h5run.filterSpeed = function (maxSpeed) {
    var prevPosition;
    var distance;
    var duration;

    if (maxSpeed <= 0) {
        maxSpeed = 10.5;
    }

    return {
        pass : function (position) {
            if (!prevPosition) {
                prevPosition = position;
                return true;  // first position
            }

            try {
                distance = artxgj.h5run.distance(prevPosition,position);

            } catch (err) {
                // perhaps the exception should just be sent directly to caller
                return false;
            }

            if (distance === 0) {
                return false;
            }


            duration = position.timestamp - prevPosition.timestamp;
            if (duration > 0 &&
                    (distance/(duration/1000)) <= maxSpeed ) {
                prevPosition = position;
                return true;
            }

            return false;
        }
    };
};


artxgj.h5run.fsmEvents = {
    acquireGPS       : 0,
    acquiredGPS      : 1,
    stopAcquiringGPS : 2,
    startMoving      : 3,
    stopMoving       : 4
};


artxgj.h5run.fsmStates = {
    reset        : 0,
    acquiringGPS : 1,
    gpsAcquired  : 2,
    moving       : 3
};


artxgj.h5run.fsm = function () {

    var listeners = [];
    var state = artxgj.h5run.fsmStates.reset;  // initial state

    var fsm = function () {

       // state x event table

       //                 acquireGPS | acquiredGPS | stopAcquiringGPS | startRunning | stopRunning
       // reset               1      |      -      |         -        |       -      |       -
       // acquiringGPS        -      |      2      |         0        |       -      |       -
       // gpsAcquired         -      |      -      |         -        |       3      |       -
       // running             -      |      -      |         -        |       -      |       0

       var stateTable = Array.matrix(4,5, '-');

       stateTable[0][0] = 1;
       stateTable[1][1] = 2;
       stateTable[1][2] = 0;
       stateTable[2][3] = 3;
       stateTable[3][4] = 0;

       return stateTable;
    }();


    return {
        addListener : function (callBack) {
            listeners.push(callBack);
        },

        changeState : function (event) {
            var i;
            state = fsm[state][event];  // get next state

            for (i=0; i < listeners.length; i +=1 ) {
                listeners[i](state, event);
            }
        },

        getState : function () {
            return state;
        }

    };
};



artxgj.h5run.moveAccumStats = function () {
    var prevPosition;
    var distance=0, duration = 0;

    return {
        update : function (position) {

            if (prevPosition) {
                distance += artxgj.h5run.distance(prevPosition, position);
                duration += position.timestamp - prevPosition.timestamp;
            }

            prevPosition = position;
            return this;
        },

        get : function () {
            return {
                distance : distance,
                duration : duration
            };
        }
    };
};


artxgj.h5run.moveModel = function () {
    var callBacks = [];
    var filters = [];
    var moveStats = artxgj.h5run.moveAccumStats();
    var lastPosition;

    return {
        addListener : function(callBack) {
            callBacks.push(callBack);
            return this;
        },

        addFilter : function(callBack) {
            filters.push(callBack);
            return this;
        },

        init : function () {
            moveStats = artxgj.h5run.moveAccumStats();
        },

        update : function(position) {

            var myPosition = position;

            for (var i=0; i < filters.length; i+=1 ) {
                if (!filters[i].pass(position)) {
                    return false;
                }
            }


            try {
                if (!position.movestats) {
                    moveStats.update(position);
                    myPosition = artxgj.h5run.Position(
                            { timestamp : position.timestamp,
                              coords    : position.coords,
                              movestats : moveStats.get()
                            });
                }

                for (i=0; i < callBacks.length; i++) {
                    callBacks[i](myPosition);
                }

                lastPosition = myPosition;
            }
            catch (err) {
            	console.log("movemodel caught " + err);
                return false;
            }
            return true;
        },

        completed : function() {
            var i;

            if (lastPosition) {

                lastPosition.last = true;
                for (i=0; i < callBacks.length; i++) {
                    callBacks[i](lastPosition);
                }
            }

            moveStats = artxgj.h5run.moveAccumStats();
            lastPosition = null;
        }
    };
};




artxgj.h5run.splitsTracker = function (spec) {
	/*
		specs object:
	    splitLength :  scalar
	    unit        :  string ('mi' | 'km')
	*/

	var splits=[], listeners = [];
	var nextSplit = 0, one = 1;
	var unit = spec.unit || 'mi';
	var unitConversion;

	unit = unit.toLowerCase();

	if (unit === 'km') {
		unitConversion = one.meterToKm();
	}
	else {
	    if ( unit !== 'mi') {
	    	unit = 'mi';
	    }
	    unitConversion = one.meterToMile();
	}

	return {
		update : function (position) {
	    	var i, splitData;
	        var distance = position.movestats.distance * unitConversion;

	        if ( position.last || distance >= nextSplit ) {
	        	splitData = { position : position, unit : unit, splitDistance : distance };
	            splits.push(splitData);
	            nextSplit += spec.splitLength;

	            for (i=0; i < listeners.length; i += 1) {
	            	listeners[i](splitData);
	            }
	        }
	    },

	    get : function () {
	    	return splits;
	    },

	    addListener : function (callBack) {
	    	listeners.push(callBack);
	    }
	};
};

/*
artxgj.h5run.breadCrumbTrail=function (db, runId, successCallback, errorCallback) {

    var posOpts = artxgj.h5run.PositionOptions();
    posOpts.resource.completionCallback = finished;
    posOpts.resource.url = db;  // database connection
    posOpts.resource.data={runId : runId};

    var geolocation = artxgj.h5run.geolocationBrowserDB;
    var watchId = geolocation.watchPosition(successCallback,
                                        	errorCallback,
                                        	posOpts);


	function finished() {
		watchId = null;
	}
};
*/


artxgj.maps.adaptedGoogleMapDefault = function (options) {
    // options Object
    //      mapDivName        : string, div for google map
    //      centerLatitude    : number, latitude of map's center
    //      centerLongitude   : number, longitude of map's center
    //      zoom              : number, map zoom level
    //      mapTypeControl    : boolean

    console.log("adaptedGoogleMapDefault");
    console.dir(options);
    return new google.maps.Map(
        document.getElementById(options.mapDivName),
        {
            zoom      : options.zoom || 12,
            center    : new google.maps.LatLng(options.centerLatitude,
                            options.centerLongitude),
            mapTypeId : options.mapTypeId || google.maps.MapTypeId.ROADMAP,
            mapTypeControl : options.mapTypeControl || false,
            mapTypeControlOptions :
                {style : google.maps.MapTypeControlStyle.DROPDOWN_MENU}
        });
};

artxgj.maps.pinImage = function (pin) {
    // Google Map Pin creation reference:
    // http://groups.google.com/group/google-chart-api/web/chart-types-for-map-pins?pli=1
    //
    // see http://code.google.com/apis/chart/colors.html

    // default pin object
    var mapPin = {
        fillColor : '32CD32',  //RRGGBB
        fontSize : 14,
        fontStyle : 'normal',  // normal or bold
        rotation : 350,
        scaleFactor : 0.5,
        text : '%E7%88%B1'     // Chinese character for love :)
    // to do in the future, add a multiline text indicator
    };

    var url;

    if (pin) {

        mapPin.fillColor = (pin.fillColor &&
                               typeof pin.fillColor === 'string')
                               ? pin.fillColor : mapPin.fillColor;

        mapPin.fontSize = (pin.fontSize &&
                              typeof pin.fontSize === 'number')
                              ? pin.fontSize : mapPin.fontSize;

        mapPin.fontStyle = (pin.fontStyle &&
                               typeof pin.fontStyle === 'string')
                               ? pin.fontStyle : mapPin.fontStyle;

        mapPin.rotation = (pin.rotation &&
                              typeof pin.rotation === 'number')
                              ? pin.rotation : mapPin.rotation;

        mapPin.scaleFactor = (pin.scaleFactor &&
                                typeof pin.scaleFactor === 'number')
                                ? pin.scaleFactor : mapPin.scaleFactor;


        if (pin.text) {
            mapPin.text = (typeof pin.text !== 'object' &&
                           typeof pin.text !== 'function' )
                          ? pin.text : mapPin.text;

        }
        else if (typeof pin.text === 'number') {
            // number 0 is a valid pin name
            mapPin.text = pin.text;
        }

    }


    if (mapPin.fontStyle.toLowerCase() === 'bold') {
        mapPin.fontStyle = 'b';
    }
    else {
        // default font-style : normal
        mapPin.fontStyle = '_';
    }


    url = "http://chart.apis.google.com/chart?chst=d_map_spin&chld=" +
           mapPin.scaleFactor + "|" +
           mapPin.rotation + "|" +
           mapPin.fillColor + "|" +
           mapPin.fontSize + "|" +
           mapPin.fontStyle + "|" +
           mapPin.text;

    return url;
};


// Create a Google Marker with a custom Marker Image and an InfoWindow
artxgj.maps.CompositeGoogleMapMarker = function (options) {

//  map - required (format: google map object)
//  position - required  (format: google map LatLng object)
//  name (aka pin name) - optional  [default name is love (Chinese character)
//  color - optional [format: RRGGBB string, default color is green]
//  fontSize - name's font size optional
//  scaleFactor - pin's scale factor [format: decimal number]
//  hoverText - optional
//  windowContent - optional
//  windowMaxWidth - optional

    var WINDOW_DEFAULT_WIDTH = 10,
        infoWindow,
        marker,
        maxWidth,
        pinIcon,
        that = this;  // see pp. 28-29 of Crockford's Javascript: The Best Parts
                      // for an explanation of this workaround for
                      // the Function Invocation pattern

    if (!options) {
        throw "Missing argument [artxgj.maps.CompositeGoogleMapMarker]";
    }

    if (!options.position || !options.map ) {
        throw "Missing required marker options [artxgj.maps.CompositeGoogleMapMarker]";
    }


    var createPinIcon = function () {

        var pin = {};

        if (isNumber(options.name)) {
            pin.text = options.name.toString(10);
        }
        else {
            pin.text = options.name;
        }
        pin.fillColor = options.color || '';
        pin.fontSize = options.fontSize || '';
        pin.scaleFactor = options.scaleFactor || '';
        pin.rotation = options.rotation || '';

        return new google.maps.MarkerImage(artxgj.maps.pinImage(pin));
    };


    var addInfoWindowText = function () {

        // helper function with access to private member infoWindow via the
        // 'that' object. CompositeGoogleMapMarker's map only allows one instance
        // of the InfoWindow object


        if (options.windowContent &&
            typeof options.windowContent === 'string') {

            if (options.windowMaxWidth &&
                    typeof options.windowMaxWidth === 'number') {
                    maxWidth = options.windowMaxWidth|| WINDOW_DEFAULT_WIDTH;
            }
            else {
                maxWidth = WINDOW_DEFAULT_WIDTH;
            }

            if (!that.infoWindow) {
                that.infoWindow = new google.maps.InfoWindow({maxWidth:maxWidth});

            }
            google.maps.event.addListener(marker,
                        'click',
                        function () {
                            that.infoWindow.setContent(options.windowContent);
                            that.infoWindow.open(options.map, marker);
                        });
        }
    };

    // Create Marker
    marker = new google.maps.Marker(
                                    { position: options.position,
                                      map: options.map,
                                      icon: createPinIcon() }
                                   );

    if (options.hoverText && typeof options.hoverText === 'string' ) {
        marker.setTitle(options.hoverText);
    }


    if (options.windowContent && typeof options.windowContent === 'string') {
        addInfoWindowText(marker);
    }

    return marker;
};


artxgj.maps.boundingBox = function() {
    var minLat, minLon, maxLat, maxLon;

    return {
        get : function() {
            return { latitudeSW : minLat,
                     longitudeSW : minLon,
                     latitudeNE : maxLat,
                     longitudeNE: maxLon};
        },


        add : function(latitude, longitude) {
            // latitude, longitude : number

            if (latitude > 90 || latitude < -90 ||
                longitude > 180 || longitude < -180) {
                throw "latitude or longitude is out of bounds [artxgj.maps.update]";
            }

            if (!minLat && minLat !== 0) {
                minLat = maxLat = latitude;
                minLon = maxLon = longitude;
            }
            else {
                minLat = (latitude < minLat) ? latitude : minLat;
                maxLat = (latitude > maxLat) ? latitude : maxLat;
                minLon = (longitude < minLon) ? longitude : minLon;
                maxLon = (longitude > maxLon) ? longitude : maxLon;
            }
            return this;
        },
        center : function() {
            // center of minimum bounding box
            var distance, latitude, longitude;

            if ((minLon*maxLon) < 0) {
                // coordinates are on different sides of the prime meridian or
                // international dateline
                // minLon is W of Prime Meridian (minLon < 0)
                // maxLon is E of Prime Meridian
                if ((minLon + maxLon) === 0) {
                    // bias for International Dateline if longitudes are +/- 90

                    longitude = (maxLon >= 90) ? 180 : 0;
                }
                else {
                    distance = 360+minLon-maxLon;

                    longitude = (distance <= 180) ? maxLon + distance/2
                                                  : minLon + (360-distance)/2;
                }
            }
            else {
                longitude = (minLon + maxLon)/2;
            }

            latitude = (minLat + maxLat) / 2;
            return { latitude : latitude, longitude : longitude};
        }
    };
};


artxgj.h5run.mapbounds = artxgj.maps.boundingBox;

artxgj.h5run.drawSplitMarker = function (options) {
//
// options object:
//    {
//	      map    : google map object
//	      color  : string, RRGGBB [not prefixed with # because of Google Chart]
//	  }
    if (!options || !options.map) {
        throw "Missing options argument [artxgj.drawSplitMarker]";
	}

    var markerName = 0;


    return {
        update : function (specs) {

            var latlng = new google.maps.LatLng(
                            specs.position.coords.latitude,
                            specs.position.coords.longitude),

            marker = artxgj.maps.CompositeGoogleMapMarker({
                                position: latlng,
                                map : options.map,
                                color : options.color,
                                scaleFactor : 0.60,
                                name : specs.position.last ? 'F'
                                                : markerName,
                                hoverText : specs.position.movestats.distance,
                                rotation : 355,
 //                               windowContent : windowContent(specs),
                                windowMaxWidth : 13 });
            markerName += 1;
        }
    };
};

artxgj.h5run.gMapPathDrawOnce = function (options) {
// http://code.google.com/apis/maps/documentation/v3/reference.html#PolylineOptions
//
   //
// options object {
//	     map           : google map object
//	     strokeColor   : string,  HTML hex style, i.e. "#RRGGBB"
//	     strokeOpacity : number,
//	     strokeWeight  : number,
//	     markCenter    : boolean, add a center marker after path has been drawn
	// }
	//

	    if (!options || !options.map) {
	        throw "Missing options or required map argument [artxgj.h5run.gmapPath]";
	    }

	    var gmaps = google.maps,
	        mapBox = artxgj.maps.boundingBox(),
	        strokeColor = options.strokeColor || '#9900CC',   // purple
	        strokeOpacity = options.strokeOpacity || 1.0,
	        strokeWeight = options.strokeWeight || 3,
            polyLine,
            pathCoordinates = [];

	    return {
	        update : function (position) {
	            // requires last position to have a boolean flag last set to TRUE.
	            //
	            var latlng, boxCoords, path;

	            pathCoordinates.push(new gmaps.LatLng(position.coords.latitude,
	                                                  position.coords.longitude));

	            mapBox.add(position.coords.latitude,
	                       position.coords.longitude).center();


	            if ( position.last ) {
	                boxCoords = mapBox.get();
	                options.map.fitBounds(new gmaps.LatLngBounds(
	                						new gmaps.LatLng(boxCoords.latitudeSW, boxCoords.longitudeSW),
	                						new gmaps.LatLng(boxCoords.latitudeNE, boxCoords.longitudeNE)
	                					));
                    polyLine = new gmaps.Polyline({
                            path : pathCoordinates,
                            strokeColor: strokeColor,
                            strokeOpacity: strokeOpacity,
                            strokeWeight: strokeWeight
                    });

                    polyLine.setMap(options.map);
	            }
	            else {
//	                options.map.setCenter(latlng);
	            }
	        }
	    };
	};


artxgj.h5run.gMapPath = function (options) {
// http://code.google.com/apis/maps/documentation/v3/reference.html#PolylineOptions
//
   //
// options object {
//	     map           : google map object
//	     strokeColor   : string,  HTML hex style, i.e. "#RRGGBB"
//	     strokeOpacity : number,
//	     strokeWeight  : number,
//	     markCenter    : boolean, add a center marker after path has been drawn
	// }
	//

	    if (!options || !options.map) {
	        throw "Missing options or required map argument [artxgj.h5run.gmapPath]";
	    }

	    var gmaps = google.maps,
	        hasOriginCenter = false,
	        mapBox = artxgj.maps.boundingBox(),
	        markCenter = options.markCenter || false,
	        strokeColor = options.strokeColor || '#9900CC',   // purple
	        strokeOpacity = options.strokeOpacity || 1.0,
	        strokeWeight = options.strokeWeight || 3,
            polyOptions = { path: new gmaps.MVCArray(),
                            strokeColor: strokeColor,
                            strokeOpacity: strokeOpacity,
                            strokeWeight: strokeWeight },
            polyLine = new gmaps.Polyline(polyOptions);

	    polyLine.setMap(options.map);


	    return {
	        update : function (position) {
	            //
	            //
	            var latlng, boxCoords, path;

	            latlng = new gmaps.LatLng(
	                                position.coords.latitude,
	                                position.coords.longitude);

	            mapBox.add(position.coords.latitude,
	                       position.coords.longitude).center();

                path = polyLine.getPath();
                path.insertAt(path.getLength(), latlng);

	            if ( position.last ) {
	                boxCoords = mapBox.get();
	                options.map.fitBounds(new gmaps.LatLngBounds(
	                						new gmaps.LatLng(boxCoords.latitudeSW, boxCoords.longitudeSW),
	                						new gmaps.LatLng(boxCoords.latitudeNE, boxCoords.longitudeNE)
	                					));

	            }
	            else {
//	                options.map.setCenter(latlng);
	            }
	        }
	    };
	};


/**
 *
 * @param mapDivName div name where Google Map is rendered
 * @param zoom Google Map zoom level
 * @param showSplitMarkers (boolean)
 */
artxgj.h5run.gMap = function (mapDivName, zoom, showSplitMarkers) {

    var model = artxgj.h5run.moveModel(), _update = mapinit;

    function mapinit(position) {
        var splitsModel, splitMarker;
        var map = artxgj.maps.adaptedGoogleMapDefault(
                        { mapDivName      : mapDivName,
                          centerLatitude  : position.coords.latitude,
                          centerLongitude : position.coords.longitude,
                          zoom            : zoom } );

        var runPath = artxgj.h5run.gMapPathDrawOnce({map:map});
//        var runPath = artxgj.h5run.gMapPath({map:map});
        model.addListener(runPath.update);

        if (showSplitMarkers) {
            splitsModel = artxgj.h5run.splitsTracker({splitLength:1, unit:'mi'});
            splitMarker = artxgj.h5run.drawSplitMarker({map:map, color:'FF8C00'});
            splitsModel.addListener(splitMarker.update);
            model.addListener(splitsModel.update);
        }
        model.update(position);
        _update = model.update;
    }

    return {
        update : function (position) {
                _update(position);
            }
    };
};
