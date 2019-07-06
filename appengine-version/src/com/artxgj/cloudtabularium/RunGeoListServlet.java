package com.artxgj.cloudtabularium;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Calendar;
import java.util.Collection;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.TimeZone;
import java.util.logging.Logger;

import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.Persistence;
import javax.persistence.EntityTransaction;
import javax.persistence.Query;
import com.artxgj.cloudtabularium.EMF;
import javax.servlet.http.*;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")

public class RunGeoListServlet extends HttpServlet {
    private static final Logger log = Logger.getLogger(RunGeoListServlet.class.getName());
    
    public void doGet(HttpServletRequest req, HttpServletResponse resp)
              throws IOException {
        UserService userService = UserServiceFactory.getUserService();
        User user = userService.getCurrentUser();
        
        if (user != null) {
           
            long startTime = Long.valueOf(MyUtils.nullEmptyToZero(
            						req.getParameter("startTime")), 10);
            
            EntityManager em = EMF.get().createEntityManager();
			PrintWriter out = resp.getWriter();

            try {
            	
            	String results = 
            		RunGeolocations.xmlResultSet(em, user.getUserId(), startTime);
            	
            	if (!results.isEmpty()) {
                    resp.setContentType("text/xml");
                    resp.setHeader("Cache-Control", "no-cache");
                    resp.getWriter().write(results);
            	}

            } catch (Exception e) {
            	e.printStackTrace();   
            	
            }
            finally {
            	em.close();            	
            }
        } else {
            resp.setContentType("text/html");
            resp.getWriter().println("Sorry, you don't have permission to use this program");
        }
    }
}