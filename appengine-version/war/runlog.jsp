<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Collection" %>
<%@ page import="java.util.Calendar" %>
<%@ page import="java.util.GregorianCalendar" %>
<%@ page import="java.util.TimeZone" %>

<%@ page import="java.util.logging.Logger" %>
<%@ page import="javax.jdo.PersistenceManager" %>
<%@ page import="javax.jdo.Query" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>

<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
    <head>
        <title>Art's Run/Walk Stats and Maps Report</title>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <meta name="description" content="mapped runs and split times" />
        <meta name="keywords" content="google maps api version 3, w3c geolocation,iphone, jQuery, map, running, polyline" />
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="css/cloudtab.css" title="modified andreas09" media="screen,projection" />
        <link rel="stylesheet" type="text/css" media="screen" href="css/ui-lightness/jquery-ui-1.7.2.custom.css" />
        <link rel="stylesheet" type="text/css" media="screen" href="css/ui.jqgrid.css" />
        <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=true"></script>
        <script src="js/lgpl.js"></script>
        <script src="js/crockford.js"></script>
        <script src="js/artxgj.ext.js"></script>
        <script src="js/artxgj.maps.js"></script>
        <script src="js/artxgj.gps.js"></script>
        <script src="js/jquery-1.3.2.min.js"></script>
        <script src="js/grid.locale-en.js"></script>
        <script src="js/jquery.jqGrid.min.js"></script>
        <script src="js/moveModel.js"></script>
        <script src="js/splitsTracker.js"></script>
        <script src="js/moveAccumStats.js"></script>
        <script src="js/splitsViews.js"></script>
        <script src="js/paths.js"></script>
    </head>

    <body>
<%
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();
    if (user == null) {
    
        response.sendRedirect(userService.createLoginURL(request.getRequestURI()));
    }
%>
        <div id="header">
            <h1>Cloud Tabularium</h1>
        </div>

        <div id="navbar" class="clearfix">
            <ul>
                <li><a href="index.jsp">Home</a></li>
                <li><a class="current">Run Stats & Maps</a></li>
                <li><a class="aux" href="<%= userService.createLogoutURL(request.getRequestURI()) %>" class="menu_link">Sign out <%= user.getNickname() %></a></li>
            </ul>
        </div>


        <div id="container">
            <div id="wrap">
                <div id="rightside">
                    <h2>Runs & Walks</h2>
                    <div  id="runsSelectionList"></div>
                    <div id="error"></div>
                </div>

                <div id="contentalt">
                    <h3><span id="runName"></span></h3>
                    <div id="map_canvas" 
                         style="border:1px solid orange; 
                                height:480px;
                                width:99%;"> 
                    </div> 
                    <div>&nbsp;</div>
                    <div  style="width:100%;">
                        <table id="geoSplits"></table>
                    </div>
                	<div class="clearingdiv"></div>
                </div>
                <div class="clearingdiv"></div>
            </div>
        </div>
        <script>
            var model;
            var runsList = [];
            var watchId;

            createRunsList(runsList);


            function displayMapSplits(run) {
                var geolocation;
                var geoOptions;
                var gpsSplitsTable;
                var map;
                var posOpts;
                var runPath;
                var runSplitsTable;
                var splitMarker;
                var splitsModel = artxgj.splitsTracker({splitLength:1, unit: 'mi'});

                $('#runName').html(run.name);

                model = artxgj.moveModel();

                map = artxgj.maps.adaptedGoogleMapDefault(
                                {  mapDivName      : 'map_canvas',
                                   centerLatitude  : 37.805745,
                                   centerLongitude : -122.447911,
                                   mapTypeId       : google.maps.MapTypeId.TERRAIN,
                                   zoom            : 14 } );

                runPath = artxgj.drawRunPathGoogle({map:map});
                gpsSplitsTable = artxgj.displayGeoSplitsGrid('geoSplits');
                splitMarker = artxgj.drawSplitMarker({map:map, color:'FF8C00'});

                splitsModel.addListener(gpsSplitsTable.update);
                splitsModel.addListener(splitMarker.update);
                model.addListener(runPath.update);
                model.addListener(splitsModel.update);

                posOpts = artxgj.gps.PositionOptions();
                posOpts.resource.completionCallBack = model.completed;
                posOpts.resource.url = 'rungeolist';
                posOpts.resource.data='startTime=' + run.startTime;

                geolocation = artxgj.gps.geolocationFactory.createGeolocation(
                                artxgj.gps.geolocationFactory.GEOSOURCE.url);


                watchId = geolocation.watchPosition(onReceiveGPS,
                                                    onGPSError,
                                                    posOpts);
            }


            function createRunsList(runsList) {
                $.get("runs", function(data) {
                    var run, xml;
                    var runtextlist = [];

                    if (typeof data === "string") {
                        $('body').append("training data returned is string-type");
                        xml = new ActiveXObject("Microsoft.XMLDOM");
                        xml.async = false;
                        xml.loadXML(data);
                    } else {
                        xml = data;
                    }

                    $('run', xml).each(function(i) {
                        run = {};  
                        run.name = $(this).find('name').text().trim();
                        run.startTime = parseFloat($(this).find('startTime').text().trim());
                        run.timeZone = parseFloat($(this).find('timeZone').text().trim());
                        run.distance = parseFloat($(this).find('distance').text().trim());
                        run.duration = parseFloat($(this).find('duration').text().trim());
                        runsList.push(run);
                        
                        var rundate = LocaleDTSDate(run.startTime, run.timeZone);
                        runtextlist.push('<li id="run'
                                            + i + '" class="li_run">' + rundate.getUTCFullYear() + "-" + 
                                            (rundate.getUTCMonth()+1) + "-" + rundate.getUTCDate()
                                            + '</li>');
                    });

                    $('#runsSelectionList').append("<ul class='runslist'>" +
                                                    runtextlist.join('')
                                                    + "</ul>");
                    // add li click handler
                    $(function(){
                        $('.li_run').click(function(event){
                        
                            if (event.target.tagName !='LI') {
                                return true;
                            }

                            displayMapSplits(runsList[this.id.match(/\d+/)]);

                        });
                    });

                    // display first map
                    displayMapSplits(runsList[0]);
                });
            }


            function onReceiveGPS(position) {
                var rc = model.update(position);
            }


            function onGPSError(error) {
                $('#error').html("<b>Error: </b>" + error.code +
                                    "==>" + error.message);
            }



        </script>
<%@ include file="footer.txt" %>
<%@ include file="ga.txt" %>
    </body>
</html>
