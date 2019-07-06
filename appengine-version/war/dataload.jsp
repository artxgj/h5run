<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.logging.Logger" %>

<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>

<html>
  <head>
        <title>
            Wee! Data Loader
        </title>
        <meta name="viewport" content="width=device-width, minimum-scale=1.0, maximum-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <META HTTP-EQUIV="Pragma" CONTENT="no-cache">
        <META HTTP-EQUIV="Expires" CONTENT="-1">
        <link rel="stylesheet" type="text/css" href="css/cloudtab.css" title="modified andreas09" media="screen,projection" />
        <script src="js/lgpl.js"></script>
        <script src="js/crockford.js"></script>
        <script src="js/artxgj.ext.js"></script>
        <script src="js/jquery.js"></script>
        <script src="js/readers.js"></script>
        <script src="js/postGPSLoader.js"></script>
    
  </head>
  <body>

<%
    UserService userService = UserServiceFactory.getUserService();
    User user = userService.getCurrentUser();
    if (user == null) {
    
        response.sendRedirect(userService.createLoginURL(request.getRequestURI()));
    }
%>
        <div id="container">
            <div id="sitename">
                <h1>Beijing Bayou</h1>
                <h2>@Google Apps</h2>
            </div>
            <div id="mainmenu">
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="iphonerun.html">Run Tracker</a></li>
                    <li><a class="current">Mapped Runs</a></li>
                    <li><a href="polylineart.html">Polyline Art</a></li>
                    <li><a href="tangrenjie.html">Chinatown Gates</a></li>
                    <li><a href="about.html">About</a></li>
                </ul>
            </div>

            <div id="wrap">
                <div id="rightside">
                    <h2>Data Files</h2>
                    <div  id="runsSelectionList"></div>
                    <div id="error"></div>
                </div>

                <div id="contentalt">
                    <h2 id="runmap_title">
                        Data Loader</h2>
                    <h3><span id="rundate"></span>:&nbsp;
                        <span id="rungroup"></span></h3>
                    <div class="clear">&nbsp;</div>
                    <div>
                        <table id="gpstbl" class="sample">
                            <tr>
                                <th>Seq Id</th>
                                <th>Start Time</th>
                                <th>Timezone</th>
                                <th>Duration</th>
                                <th>Distance</th>
                                <th>Latitude</th>
                                <th>Longitude</th>
                                <th>Accuracy</th>
                                <th>Altitude</th>
                                <th>Altitude Accuracy</th>
                                <th>Heading</th>
                                <th>Speed</th>
                                <th>Timestamp</th>
                            </tr>
                        </table>
                    </div>
                    <div class="clear">&nbsp;</div>
                    <div>
                        <button id="btnSave">save</button>
                        Post Interval: <input id="postInterval" type="text" name="postInterval" /><br />
                    </div>
                    <div class="clear">&nbsp;</div>
                </div>
                <div class="clearingdiv"></div>
            </div>
        </div>
        <script>
            var gpsreader = artxgj.gpsreader();
            var runsList = [];
            var records = [];
            var watchId;

            // set up button click handler
            $('#btnSave').click(function () {

                postData($('#postInterval').val().length > 0
                                ? $('#postInterval').val() : 0 );
            });

            createRunsList({records: records, runs : runsList});


            function displayMapSplits(run) {
                var posOpts = {};

                $('#rundate').html("<b>" + run.date + "</b>");
                $('#rungroup').html(run.group);


                posOpts = artxgj.gps.PositionOptions();
                posOpts.resource.completionCallBack = onFinish;
                posOpts.resource.url = run.url;

                watchId = gpsreader.get(onReceiveGPS,
                                        onGPSError,
                                        posOpts);
            }


            function createRunsList(specs) {
                $.get("data/marathon.2010.training.xml", function(data) {
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
                        run.group = $(this).find('group').text().trim();
                        run.date = $(this).find('date').text().trim();
                        run.url = $(this).find('url').text().trim();

                        specs.runs.push(run);
                        runtextlist.push('<li id="run'
                                            + i + '" class="li_run">' + run.date
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

                            $('#gpstbl').html(
                                "<tr>" +
                                "<th>Seq Id</th>" +
                                "<th>Start Time</th>" +
                                "<th>Timezone</th>" +
                                "<th>Duration</th>" +
                                "<th>Distance</th>" +
                                "<th>Latitude</th>" +
                                "<th>Longitude</th>" +
                                "<th>Accuracy</th>" +
                                "<th>Altitude</th>" +
                                "<th>Altitude Accuracy</th>" +
                                "<th>Heading</th>" +
                                "<th>Speed</th>" +
                                "<th>Timestamp</th>" +
                                "</tr>"
                            );
                            records = [];
                            displayMapSplits(specs.runs[this.id.match(/\d+/)]);

                        });
                    });

                    // display first map
                    displayMapSplits(specs.runs[0], specs.records);
                });
            }


            function onReceiveGPS(record) {
                records.push(record);
            }


            function onGPSError(error) {
                $('#error').html("<b>Error: </b>" + error.code +
                                    "==>" + error.message);
            }


            function onFinish() {
                var i=0;

                for(i = 0; i < records.length; i += 1) {
                    $("<tr>" +
                      "<td>" + records[i].seqnum + "</td>" +
                      "<td>" + records[i].starttime + "</td>" +
                      "<td>" + records[i].timezone + "</td>" +
                      "<td>" + records[i].duration + "</td>" +
                      "<td>" + records[i].distance + "</td>" +
                      "<td>" + records[i].latitude + "</td>" +
                      "<td>" + records[i].longitude + "</td>" +
                      "<td>" + records[i].accuracy + "</td>" +
                      "<td>" + records[i].altitude + "</td>" +
                      "<td>" + records[i].altitudeAccuracy + "</td>" +
                      "<td>" + records[i].heading + "</td>" +
                      "<td>" + records[i].speed + "</td>" +
                      "<td>" + records[i].timestamp + "</td>" +
                      "</tr>"
                    ).appendTo('#gpstbl');
                }

                $("#gpstbl tr:nth-child(even)").addClass("striped");

            }


            function postData(interval) {

                var loader = artxgj.postGPSLoader({url:'rungeo',
                                          interval: interval});
                var i;

                for (i=0; i < records.length; i++) {
                    loader.send(records[i]);
                }

                if ( interval > 0) {
                    loader.send(records[records.length-1], true);
                }
                alert("data loaded");
            }

        </script>

        <div id="footer">
            <p>&copy; 2009 <a href="#">Beijing Bayou</a> | Original CSS design by <a href="http://andreasviklund.com/">Andreas Viklund</a></p>
        </div>

  </body>
</html>