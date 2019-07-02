/**
 * User: art
 * Date: Nov 13, 2010
 * Time: 2:46:18 PM
 */

window.artxgj  = window.artxgj || {};
artxgj.h5run = artxgj.h5run || {};

artxgj.h5run.MINUTE = 60*1000; // in milliseconds
artxgj.h5run.DISTANCE_FIXED = 3;
artxgj.h5run.ACCURACY_FILTER = 100;

artxgj.h5run.clickEvent = (function () {
    // http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone
    // http://blog.jqtouch.com/post/205113875/milliseconds-responsiveness-and-the-fast-tap
    //http://digitalize.ca/2010/02/jqtouch-tap-vs-click/

    var userAgent = navigator.userAgent.toLowerCase(),
        isAppleMobile = userAgent.indexOf('iphone') != -1 || userAgent.indexOf('ipad') != -1 || userAgent.indexOf('ipod') != -1;
    return isAppleMobile ? 'tap' : 'click';
})();


artxgj.h5run.chrono = function (dbconn) {
	var ns = artxgj.h5run,
        accuracyFilter = ns.filterAccuracy(ns.ACCURACY_FILTER),
        buttons = [],
        eventActions = [getGPS, gotGPS, stopGPS, startMoving, stopMoving],
		fsm = ns.fsm(),
        geolocation,
        model,
		runLocalDb = ns.RunLocationManager(dbconn, 20000),
        runStartTime = 0,
        watchId,
        hChrono;

    // set up gps fsm
    fsm.addListener(onStateChanged);

    // set up button click handler
    $('#btnAction').click(function () {
        fsm.changeState(buttons[fsm.getState()].event);
    });

    setupButtons();

    // initialize button
    $('#btnAction').html(buttons[fsm.getState()].text);


    model = ns.moveModel();
    model.addFilter(accuracyFilter);
    model.addFilter(artxgj.h5run.filterSpeed(10.53));
    model.addListener(onDisplayData);
    model.addListener(runLocalDb.update);


    function onStateChanged(newState, triggerEvent) {
        $('#btnAction').html(buttons[newState].text);
        eventActions[triggerEvent]();
    }


    function setupButtons() {
        buttons[ns.fsmStates.reset] = {
                text   : 'Acquire GPS',
                event  : ns.fsmEvents.acquireGPS
        };

        buttons[ns.fsmStates.acquiringGPS] = {
                text   : 'Stop Acquiring GPS',
                event  : ns.fsmEvents.stopAcquiringGPS
        };

        buttons[ns.fsmStates.gpsAcquired] = {
                text   : 'Start Moving',
                event  : ns.fsmEvents.startMoving
        };

        buttons[ns.fsmStates.moving] = {
                text   : 'Stop Moving',
                event  : ns.fsmEvents.stopMoving
        };
    }

    function displayGPSData(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var accuracy = position.coords.accuracy;
        $('#latitude').html(latitude.toFixed(9));
        $('#longitude').html(longitude.toFixed(9));
        $('#accuracy').html(accuracy.toFixed(9));
    }


    function onDisplayData(position) {
    	var ns = artxgj.h5run,
            distance = (position.movestats.distance).meterToMile(),
            duration = position.movestats.duration,
            pace = (distance >  0 ?(duration/ns.MINUTE/distance) :0);

        $('#distance').html(distance.toFixed(ns.DISTANCE_FIXED));
        $('#pace').html(pace.toRunPaceString());
        $('#duration').html(duration.toChronoString());
        displayGPSData(position);
    }


    function clearDisplayData() {
        $('#time').html("0:00:00");
        $('#distance').html("0.00");
        $('#pace').html("0:00");
        $('#duration').html("0:00:00");
        $('#latitude').html("-");
        $('#longitude').html("-");
        $('#accuracy').html("-");
    }


    function onReceiveError(error) {
    }


    function onReceiveGPS(position) {
        displayGPSData(position);
        if (fsm.getState() === ns.fsmStates.acquiringGPS) {
            if (accuracyFilter.pass(position)) {
                fsm.changeState(ns.fsmEvents.acquiredGPS);
            }
        }
        else if ( fsm.getState() === ns.fsmStates.moving ) {
            model.update(position);
        }

    }


    function getGPS() {
        var posOpts = ns.PositionOptions();

        // override defaults;
        posOpts.maximumAge = 0;
        posOpts.timeout = 20000;

        posOpts.resource.completionCallBack = stopMoving;
        clearDisplayData();

        if ( !(posOpts.resource.url = parseDataSourceURL()) ) {
            geolocation = artxgj.h5run.geolocationFactory.createGeolocation(
                          artxgj.h5run.geolocationFactory.GEOSOURCE.browser);

        }
        else {
            // playback/testing
            geolocation = ns.geolocationFactory.createGeolocation(
                          ns.geolocationFactory.GEOSOURCE.url);

            // initiate state changes to allow playback to dump data via
            // the Start Moving button
            fsm.changeState(ns.fsmEvents.acquiredGPS);

        }


        model.init();
        watchId = geolocation.watchPosition(onReceiveGPS,
                                            onReceiveError,
                                            posOpts);
    }


    function gotGPS() {
        if (parseDataSourceURL()) {
            // initiate start for playback/testing
            fsm.changeState(ns.fsmEvents.startMoving);
        }
    }


    function stopGPS() {
    	model.completed();
        if (watchId) {
            geolocation.clearWatch(watchId);
        }
    }


    function startMoving() {
        runStartTime = new Date();
        hChrono = setTimeout(updateRunTimeDisplay,1000);
    }


    function stopMoving() {
        clearTimeout(hChrono);
        $('#time').html(
                ((new Date).valueOf()-runStartTime).toChronoString()
        );
        model.completed();
        runLocalDb.stop();
        geolocation.clearWatch(watchId);

        runStartTime = 0;
        watchId = null;
    }


    function updateRunTimeDisplay() {
        $('#time').html(
                ((new Date).valueOf()-runStartTime).toChronoString()
        );
        clearTimeout(hChrono);
        hChrono = setTimeout(updateRunTimeDisplay, 1000);
    }
};



artxgj.h5run.runHistoryJQTView = {

    build : function (runItem) {

        /*
         *  runItem object
         *     id  - runs table id
         *     distance  (meters)
         *     duration  (milliseconds)
         */
        var day = new Date(runItem.id),
            s = runItem.distance.meterToMile(),
            t = runItem.duration,
            input = $('<input>').attr("type", "checkbox").addClass("h5"),
            a = $('<a></a>').attr("href", "#run");

        a.append(input);
        a.append(day.getFullYear() + "-" + (day.getMonth() < 9 ? "0" :"") + (day.getMonth()+1) + "-" +
                     (day.getDate() < 10 ? "0" : "") + day.getDate() + " " + day.toLocaleTimeString());

//        a.append($('<span></span>').addClass("time").html(day.toLocaleTimeString()));
        a.append($('<span></span>').html("Distance " + s.toFixed(artxgj.h5run.DISTANCE_FIXED) + " miles").addClass("subject"));
        a.append($('<span></span>').html("Time " + t.toChronoString()).addClass("subject"));

        $('#ullog').append($('<li></li>').attr("id", runItem.id).addClass("arrow").append(a));
    }
};


artxgj.h5run.iPhoneSplitTimesTable = function(div) {

	var ul = $('<ul></ul>').addClass("edgetoedge"),
		ns = artxgj.h5run;
	$('#' + div).empty();


	return {
		update : function update(splitData) {
		/*
		 *  splitData object:
		 *  	splitDistance
		 *  	position
		 *
		 */

			if (!splitData.position.last && Math.floor(splitData.splitDistance) === 0) {
				return;
			}

			var pace = splitData.splitDistance === 0  ? 0 : splitData.position.movestats.duration/ns.MINUTE/splitData.splitDistance;

	        var chrono = $('<a></a>')
	        				.append($('<span></span>').addClass("duration").html("Duration " + splitData.position.movestats.duration.toChronoString()))
	        				.append($('<span></span>').addClass("duration").html("Pace " + pace.toRunPaceString()));

	        var lat = $('<a></a>').append($('<span></span>').addClass("duration").html("Latitude " + splitData.position.coords.latitude));
	        var lng = $('<a></a>').append($('<span></span>').addClass("duration").html("Longitude " + splitData.position.coords.longitude));

	        ul.append($('<li></li>').addClass("sep").html(splitData.splitDistance.toFixed(ns.DISTANCE_FIXED) + " " + splitData.unit))
	          .append($('<li></li>').append(chrono))
	          .append($('<li></li>').append(lat))
	          .append($('<li></li>').append(lng));

			if (splitData.position.last) {
				$('#' + div).append(ul);
			}

		}
	};
};


artxgj.h5run.splitsDisplay = function(div) {
	var prevSplitData,
		ul = $('<ul></ul>').addClass("edgetoedge");
		ns = artxgj.h5run;

	$('#' + div).empty();


	return {
		update : function update(splitData) {
		/*
		 *  splitData object:
		 *  	splitDistance
		 *  	position
		 *
		 */
			if (!splitData.position.last && Math.floor(splitData.splitDistance) === 0) {
				prevSplitData = splitData;
				return;
			}

			var avgpace = splitData.splitDistance === 0  ? 0 : splitData.position.movestats.duration/ns.MINUTE/splitData.splitDistance,
				intervalTime = (splitData.position.movestats.duration - prevSplitData.position.movestats.duration),
				intervalDistance = splitData.splitDistance - prevSplitData.splitDistance
				intervalPace = intervalDistance === 0 ? 0 : intervalTime/ns.MINUTE/intervalDistance;

	        ul.append($('<li></li>').addClass("sep").append(splitData.splitDistance.toFixed(ns.DISTANCE_FIXED) + " " + splitData.unit))
	          .append($('<li></li>').addClass("split").append("Time : " + splitData.position.movestats.duration.toChronoString()))
	          .append($('<li></li>').addClass("split").append("Pace : " + avgpace.toRunPaceString()))
	          .append($('<li></li>').addClass("split").append("Interval Time : " + intervalTime.toChronoString()))
	          .append($('<li></li>').addClass("split").append("Interval Pace : " + intervalPace.toRunPaceString()));

			prevSplitData = splitData;

			if (splitData.position.last) {
				$('#' + div).append(ul);
			}
		}
	};
};


artxgj.h5run.splitsDetails = function (spec) {
// to do : breadcrumb "factory" (url, sql database, etc.) 2010-11-13

/*
 *  spec object
 *  	db - db connection
 *      runId -
 *      div - splits Div section
 */
    var ns = artxgj.h5run,
        model = ns.moveModel(),
        runSplitsTableView = ns.splitsDisplay(spec.div),
        splitsModel = ns.splitsTracker({splitLength:1, unit: 'mi'}),
        breadcrumb = artxgj.h5run.db.tbBreadCrumb(spec.db);

    splitsModel.addListener(runSplitsTableView.update);
    model.addListener(splitsModel.update);
    breadcrumb.readList(spec.runId,
                        model.update,
                        function (error) {
                            console.log("splitsDetails breadcrumb error.code " + error.code);
                        });

};

$(document).ready(function (){
    var ns = artxgj.h5run,
        clickEvent = 'tap',
        runId,
        nsDB = artxgj.h5run.db,
        db = nsDB.instance(),
        map, clickedOnFloaty = false;

    ns.chrono(db);
    $('#logsel a').bind(clickEvent, function() {

        var tbRun = nsDB.tbRun(db);

        $('#ullog').empty();
            tbRun.readList(artxgj.h5run.runHistoryJQTView.build);
            // add jquery code to check if ullog has li children, if not, display "no runs recorded message"
    });

    $('#ullog').delegate("a", clickEvent, function (evt) {
        var rundate;

        if (evt.target.nodeName === "INPUT") {
            // prevent jQTouch from advancing to the anchor's reference when input checkbox is clicked

            var boxesChecked = $('#ullog li input[type=checkbox]:checked').length;

            if (boxesChecked > 0) {
                console.log("scrollFloaty boxesChecked = " + boxesChecked);
                $('.floaty').scrollFloaty();
                $('#ullog li').removeClass("arrow");
            }
            else {
                $('.floaty').hideFloaty();
                $('#ullog li').addClass("arrow");
            }

            return false;
        }

        else if ($('#ullog li').hasClass("arrow") === false) {
            // floaty buttons are displayed; prevent advancement to next "screen"
            return false;
        }
        else if (clickedOnFloaty) {
            // delete or upload button was just clicked; prevent advancement to next "screen"
            clickedOnFloaty = false;
            return false;
        }

        runId = ($(this).parent().attr("id"));
        rundate = new Date(parseInt(runId, 10));
        $('#runDetailsId').html(rundate.toLocaleDateString() + " " + rundate.toLocaleTimeString());

        ns.splitsDetails({db: db, runId: runId, div: "splits"});

    });


    $('#btnMap').bind(clickEvent , function() {
        var breadcrumb = nsDB.tbBreadCrumb(db);

        var map = ns.gMap('map_canvas', 14, false );

        $('#map_canvas').css("height", '460px').css("width", '100%');
        breadcrumb.readList(runId,
                            map.update,
                            function (error) {
                                console.log("map breadcrumb error.code = " + error.code);
                            });
    });


    $('#mapBack').bind(clickEvent, function() {
        $('#map_canvas').empty();
    });


    $('#logexit').bind(clickEvent, function() {
        $('.floaty').hideFloaty();
    });

    $(function(){
        $('div#jqt .floaty').makeFloaty({
            spacing: 20,
            time: '1s'
        });

        $('.floaty').hideFloaty();
    });

    $('#btnDel').bind(clickEvent, function() {

        var runId,
            tbRun = nsDB.tbRun(db);

        console.log("button delete");
        clickedOnFloaty = true;
        $('#ullog li a input').each(function () {

            if ($(this).attr("checked")  === true) {
                runId = $(this).closest('li').attr("id");
                tbRun.remove(runId);
                $(this).closest('li').remove();
            }
        });

        $(function() {$('.floaty').hideFloaty()});
    });

    $('#btnUpload').bind(clickEvent, function() {
        var runId,
            tbBreadCrumb = nsDB.tbBreadCrumb(db),
            upload;

        console.log("button update");
        clickedOnFloaty = true;

        $('#ullog li a input').each(function () {

            if ($(this).attr("checked")  === true) {
                upload = [];
                runId = $(this).closest('li').attr("id");
                tbBreadCrumb.readList(runId,
                                      function (position) {

                                          upload.push(position);

                                          if (position.last) {
                                              console.log("calling uploadBreadcrumb");
                                              uploadBreadcrumb(upload);
                                          }
                                      },
                                      function (error) {
                                          console.log("upload error");
                                      });
                $(this).attr("checked", false);
            }
        });

        $(function() {$('.floaty').hideFloaty()});

        function uploadBreadcrumb(data) {
            var alloc, chunks, i, remainder,
                startIndex, lastIndex,
                sliceChunk = 400;

            if (data.length > sliceChunk) {

                remainder = data.length % sliceChunk;
                alloc =  + (remainder > 0 ? 1: 0);
                chunks = Math.floor(data.length/sliceChunk);

                for (i=0, startIndex=0, lastIndex=sliceChunk; i < chunks; i++) {
                    console.log("slicing i " + i + ", startIndex " + startIndex + ", lastIndex " + lastIndex);

                    $.post('post.php',
                           { data: JSON.stringify(data.slice(startIndex, lastIndex))},
                           function () { console.log("posted chunk " + i) ;},
                           "text");

                    startIndex += sliceChunk;
                    lastIndex += sliceChunk;
                }

                if (remainder > 0) {
                    $.post('post.php',
                           { data: JSON.stringify(data.slice(startIndex))},
                           function () { console.log("upload done");},
                           "text");
                }
            }
            else {
                $.post('post.php',
                       { data: JSON.stringify(data)},
                       function () { console.log("upload done");},
                       "text");
            }
        }

    });

});
