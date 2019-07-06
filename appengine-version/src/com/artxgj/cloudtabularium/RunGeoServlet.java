package com.artxgj.cloudtabularium;

import java.io.IOException;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.TimeZone;
import java.util.logging.Logger;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.PersistenceException;
import javax.servlet.http.*;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

import com.artxgj.cloudtabularium.RunWorkout;
import com.artxgj.cloudtabularium.RunGeolocation;
import com.artxgj.cloudtabularium.EMF;


@SuppressWarnings("serial")

public class RunGeoServlet extends HttpServlet {
    private static final Logger log = Logger.getLogger(RunGeoServlet.class.getName());
    
    private long  seqNum;
    private long  startTime;
    private int   timeZone;
    private long  duration;
    private float distance;
    private float latitude;
    private float longitude;
    private float accuracy;
    private float altitude;
    private float altitudeAccuracy;
    private float heading;
    private float speed;
    private long  gpsTimeStamp;
    
    private void GetVars(HttpServletRequest req, HttpServletResponse resp) 
    	throws IOException {
    	
    	seqNum = Long.valueOf(MyUtils.nullEmptyToZero(req.getParameter("seqnum")),10);
        startTime = Long.valueOf(MyUtils.nullEmptyToZero(
				req.getParameter("startTime")), 10);
		timeZone = Integer.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("tz")), 10);
		duration = Long.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("duration")),10);
		distance = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("distance")));
		latitude = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("latitude")));
		longitude = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("longitude")));
		accuracy = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("accuracy")));
		altitude = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("altitude")));
		altitudeAccuracy = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("altitudeAccuracy")));
		heading = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("heading")));
		speed = Float.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("speed")));
		gpsTimeStamp = Long.valueOf(
					MyUtils.nullEmptyToZero(req.getParameter("geolocdts")),10);
    }
    
    private RunGeolocation createGPSStat() {
        RunGeolocation runGeo = new RunGeolocation();
        runGeo.setLatitude(latitude);
        runGeo.setLongitude(longitude);
        runGeo.setAccuracy(accuracy);
        runGeo.setAltitude(altitude);
        runGeo.setAltitudeAccuracy(altitudeAccuracy);
        runGeo.setHeading(heading);
        runGeo.setSpeed(speed);
        runGeo.setGpsTimestamp(gpsTimeStamp);
        runGeo.setDistance(distance);
        runGeo.setDuration(duration);
        
        return runGeo;
    }
    
    private RunWorkout createRun(User user) {
    	Calendar sfcal = new GregorianCalendar(TimeZone.getTimeZone("GMT" + timeZone));
    	sfcal.setTimeInMillis(startTime);
		
        RunWorkout run = new RunWorkout.Builder(user.getUserId(), startTime)
        							.timeZone(timeZone)
        							.distance(distance)
        							.duration(duration)
        							.name("Run/Walk on " + String.format("%1$ta, %1$tb %1$td %1$tY, %1$tT %1$tZ ", 
											sfcal)).build();
        	
        
        run.getRunGeos().add(createGPSStat());
        return run;
    	
    }
    
    public void doPost(HttpServletRequest req, HttpServletResponse resp)
              throws IOException {
        UserService userService = UserServiceFactory.getUserService();
        User user = userService.getCurrentUser();
        
        if (user != null) {
           
        	GetVars(req,resp);
            EntityManager em = null;
            EntityTransaction tx = null; 
            RunWorkout run;
            try {
                em=EMF.get().createEntityManager();
                try {
	            	run = em.find(RunWorkout.class, 
	      					  RunWorkout.createKey(user.getUserId(), Long.toString(startTime)));
                    tx=em.getTransaction();
        			tx.begin();

	    			if (run == null) {
	    				em.persist(createRun(user));
	    			}
	    			else {
	    				if ( distance > run.getDistance()) {
	    					run.setDistance(distance);
	    					run.setDuration(duration);
	    				}
	                    run.getRunGeos().add(createGPSStat());
	    			}	
	    			tx.commit();
                }
                catch (Exception e) {
                	System.out.println(">>>>> " + e.toString());
                }
                finally {
                	
                	if ( tx.isActive() ) {
                		tx.rollback();
                	}
                }
	            resp.setContentType("text/html");
	            resp.getWriter().println("OK");

            } 
            
            catch (Exception mi) {
            	System.out.println("mi " + mi.toString() + "... " + duration + ":"  + distance);
            }
            
            
            finally {
                if (em != null ) {
                	em.close();
                }
            }
        } else {
            resp.setContentType("text/html");
            resp.getWriter().println("Sorry, you don't have permission to use this program");
        }
    }
}