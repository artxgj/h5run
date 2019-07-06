<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
    <head>
        <title>Art's GPS Run/Walk Recorder</title>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <meta http-equiv="pragma" content="no-cache" />
        <meta name="description" content="GPS Run/Walk Recorder " />
        <meta name="keywords" content="google maps api version 3, w3c geolocation,iphone, jQuery, map, running, polyline" />
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="css/gpsrunwalk.css" title="" media="screen,projection" />
        <script src="js/crockford.js"></script>
        <script src="js/artxgj.ext.js"></script>
        <script src="js/lgpl.js"></script>
        <script src="js/artxgj.gps.js"></script>
        <script src="js/jquery.js"></script>
        <script src="js/moveModel.js"></script>
        <script src="js/moveAccumStats.js"></script>
        <script src="js/postGPS.js"></script>

    </head>

    <body>

<%
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();
    if (user == null) {
    
        response.sendRedirect(userService.createLoginURL(request.getRequestURI()));
    }
%>
    
    
        <div id="time">0:00:00</div>
        <div id="spacer">&nbsp;</div>
        <div>
            <span class="runstatvalue" id="distance">0</span>
            <span class="runstatunit">mi</span>
            &nbsp;
            <span class="runstatvalue" id="pace">0:00</span>
            <span class="runstatunit">min/mi</span>
        </div>
        <div id="spacer"></div>
        <div>
            <span class="geolocheading">GPS Duration</span>
            <span id="duration"></span>
        </div>
        <div>
            <p>
                <span class="geolocheading">Latitude</span>
                <span id="latitude" class="geolocvalue">-</span>
            </p>
            <p>
                <span class="geolocheading">Longitude</span>
                <span id="longitude" class="geolocvalue">-</span>
            </p>
            <p>
                <span class="geolocheading">Accuracy</span>
                <span id="accuracy" class="geolocvalue">-</span>
                <span class="runstatunit">meters</span>
            </p>
        </div>
        <button type="button" id="btnAction" class="button"></button>

        <script>

            $(document).ready(function() {
                iPhoneBrowserLayout();
            });

            var accuracyFilter = artxgj.gps.filterAccuracy(100);
            var buttons = [];
            var eventActions = [
                getGPS, gotGPS, stopGPS, startMoving, stopMoving];
            var fsm = artxgj.gps.fsm();
            var geolocation;
            var model;
            var postGPS = artxgj.postGPS({url:'rungeo',
                                          interval: 20});  // post data every 20 seconds
            
            var runStartTime = 0;
            var watchId;

            // set up gps fsm
            fsm.addListener(onStateChanged);

            // set up button click handler
            $('#btnAction').click(function () {
                fsm.changeState(buttons[fsm.getState()].event);
            });

            setupButtons();

            // initialize button
            $('#btnAction').html(buttons[fsm.getState()].text);


            model = artxgj.moveModel();
            model.addFilter(accuracyFilter);
            model.addFilter(artxgj.gps.filterSpeed(10.53));
            model.addListener(onDisplayData);
            model.addListener(postGPS.send);


            function onStateChanged(newState, triggerEvent) {
                $('#btnAction').html(buttons[newState].text);
                eventActions[triggerEvent]();
            }


            function setupButtons() {
                buttons[artxgj.gps.fsmStates.reset] = {
                        text   : 'Acquire GPS',
                        event  : artxgj.gps.fsmEvents.acquireGPS
                };

                buttons[artxgj.gps.fsmStates.acquiringGPS] = {
                        text   : 'Stop Acquiring GPS',
                        event  : artxgj.gps.fsmEvents.stopAcquiringGPS
                };

                buttons[artxgj.gps.fsmStates.gpsAcquired] = {
                        text   : 'Start Moving',
                        event  : artxgj.gps.fsmEvents.startMoving
                };

                buttons[artxgj.gps.fsmStates.moving] = {
                        text   : 'Stop Moving',
                        event  : artxgj.gps.fsmEvents.stopMoving
                };
            }


            function onDisplayData(position) {
                var distance = (position.movestats.distance).meterToMile();
                var duration = position.movestats.duration;
                var pace = (distance >  0
                                ?(duration/60000/distance)
                                :0);
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                var accuracy = position.coords.accuracy;
                $('#distance').html(distance.toFixed(2));
                $('#pace').html(pace.toRunPaceString());
                $('#duration').html(duration.toChronoString());
                $('#latitude').html(latitude.toFixed(9));
                $('#longitude').html(longitude.toFixed(9));
                $('#accuracy').html(accuracy.toFixed(9));
            }


            function clearDisplayData() {
                $('#time').html("0:00");
                $('#distance').html(0);
                $('#pace').html("0:00");
                $('#duration').html("0:00");
                $('#latitude').html("-");
                $('#longitude').html("-");
                $('#accuracy').html("-");
            }


            function onReceiveError(error) {
                // ignore for now
            }


            function onReceiveGPS(position) {

                if (fsm.getState() === artxgj.gps.fsmStates.acquiringGPS) {

                    $('#latitude').html(position.coords.latitude.toFixed(9));
                    $('#longitude').html(position.coords.longitude.toFixed(9));
                    $('#accuracy').html(position.coords.accuracy.toFixed(9));


                    if (accuracyFilter.pass(position)) {
                        fsm.changeState(artxgj.gps.fsmEvents.acquiredGPS);
                    }
                }
                else if ( fsm.getState() === artxgj.gps.fsmStates.moving ) {
                    updateRunTimeDisplay();
                    model.update(position);
                }

            }


            function getGPS() {
                var posOpts = artxgj.gps.PositionOptions();

                // override defaults;
                posOpts.maximumAge = 0;
                posOpts.timeout = 20000;

                posOpts.resource.completionCallBack = stopMoving;
                clearDisplayData();

                if ( !(posOpts.resource.url = parseDataSourceURL()) ) {
                    geolocation = artxgj.gps.geolocationFactory.createGeolocation(
                                  artxgj.gps.geolocationFactory.GEOSOURCE.browser);

                }
                else {
                    // playback/testing
                    geolocation = artxgj.gps.geolocationFactory.createGeolocation(
                                  artxgj.gps.geolocationFactory.GEOSOURCE.url);

                    // initiate state changes to allow playback to dump data via
                    // the Start Moving button
                    fsm.changeState(artxgj.gps.fsmEvents.acquiredGPS);

                }


                model.init();
                postGPS.reset();
                watchId = geolocation.watchPosition(onReceiveGPS,
                                                    onReceiveError,
                                                    posOpts);
            }


            function gotGPS() {
                if (parseDataSourceURL()) {
                    // initiate start for playback/testing
                    fsm.changeState(artxgj.gps.fsmEvents.startMoving);
                }
            }


            function stopGPS() {

                if (watchId) {
                    geolocation.clearWatch(watchId);
                }

            }


            function startMoving() {
                runStartTime = new Date();
                postGPS.setStartTime({
                    val : runStartTime.valueOf(),
                    tz  : -(runStartTime.getTimezoneOffset() / 60)
                });
            }


            function stopMoving() {
                model.completed();
                geolocation.clearWatch(watchId);
                runStartTime = 0;
                watchId = null;
            }


            function updateRunTimeDisplay() {
                $('#time').html(
                        ((new Date).valueOf()-runStartTime).toChronoString()
                );
            }

        </script>
		<script type="text/javascript">
			var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
			document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
		</script>
		<script type="text/javascript">
			try {
				var pageTracker = _gat._getTracker("UA-12565609-1");
				pageTracker._trackPageview();
			} catch(err) {}
		</script>    

	</body>
</html>
