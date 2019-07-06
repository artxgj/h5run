package com.artxgj.cloudtabularium;

import java.io.StringWriter;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

public class RunGeolocations {
	
	public static String xmlResultSet(EntityManager em, String runner, long startTime) {
    	RunWorkout run = em.find(RunWorkout.class, 
				  RunWorkout.createKey(runner, Long.toString(startTime)));
    	List<RunGeolocation> runGeoList = run.getRunGeos();
		try {
            Document doc;
            Element rootElt;

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            doc = builder.newDocument();

            rootElt = doc.createElement("geocoords");
            doc.appendChild(rootElt);    
			
			for (RunGeolocation runGeo : runGeoList) {
                Element runNode = doc.createElement("geopoint");
                
                rootElt.appendChild(runNode);

                Element latitude = doc.createElement("latitude");
                runNode.appendChild(latitude);
                latitude.appendChild(doc.createTextNode(Float.toString(runGeo.getLatitude())));
                
                Element longitude = doc.createElement("longitude");
                runNode.appendChild(longitude);
                longitude.appendChild(doc.createTextNode(Float.toString(runGeo.getLongitude())));

                Element accuracy = doc.createElement("accuracy");
                runNode.appendChild(accuracy);
                accuracy.appendChild(doc.createTextNode(Float.toString(runGeo.getAccuracy())));

                Element altitude = doc.createElement("altitude");
                runNode.appendChild(altitude);
                altitude.appendChild(doc.createTextNode(Float.toString(runGeo.getAltitude())));

                Element altitudeAccuracy = doc.createElement("altitudeAccuracy");
                runNode.appendChild(altitudeAccuracy);
                altitudeAccuracy.appendChild(doc.createTextNode(Float.toString(runGeo.getAltitudeAccuracy())));

                Element heading = doc.createElement("heading");
                runNode.appendChild(heading);
                heading.appendChild(doc.createTextNode(Float.toString(runGeo.getHeading())));

                Element speed = doc.createElement("speed");
                runNode.appendChild(speed);
                speed.appendChild(doc.createTextNode(Float.toString(runGeo.getSpeed())));

                Element distanceNode = doc.createElement("distance");
                runNode.appendChild(distanceNode);
                distanceNode.appendChild(doc.createTextNode(Float.toString(runGeo.getDistance())));
                
                Element durationNode = doc.createElement("duration");
                runNode.appendChild(durationNode);
                durationNode.appendChild(doc.createTextNode(Long.toString(runGeo.getDuration())));
                
			}
	        DOMSource domSource = new DOMSource(doc);
	        StringWriter writer = new StringWriter();
	        StreamResult result = new StreamResult(writer);
	        TransformerFactory tf = TransformerFactory.newInstance();
	        Transformer transformer = tf.newTransformer();
	        transformer.transform(domSource, result);
			
	        return writer.toString();
		} catch(Exception e) {
			e.printStackTrace();
		}
		return null;
	}
}
