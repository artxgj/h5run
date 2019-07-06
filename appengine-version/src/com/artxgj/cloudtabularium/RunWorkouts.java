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

public class RunWorkouts {
	@SuppressWarnings("unchecked")
	public static List<RunWorkout> find(EntityManager em, String runner) {
		Query query = em.createQuery(
			"SELECT b FROM RunWorkout b WHERE b.owner = :userId");
		query.setParameter("userId", runner);
		List<RunWorkout> runs = null;
		try {
			runs = query.getResultList();
		} catch(Exception e) {
			e.printStackTrace();
		}
		return runs;
	}
	
	public static String xmlResultSet(EntityManager em, String runner) {
		Query query = em.createQuery(
		"SELECT b FROM RunWorkout b WHERE b.owner = :userId ORDER BY b.startTime DESC");
		query.setParameter("userId", runner);
		List<RunWorkout> runs = null;
		try {
			runs = query.getResultList();
            Document doc;
            Element rootElt;

            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            doc = builder.newDocument();

            rootElt = doc.createElement("runs");
            doc.appendChild(rootElt);    
            rootElt.setAttribute("person", runner);
			
			for (RunWorkout run : runs) {
                Element runNode = doc.createElement("run");
                
                rootElt.appendChild(runNode);

                Element name = doc.createElement("name");
                runNode.appendChild(name);
                name.appendChild(doc.createTextNode(
                		(run.getName() == null || run.getName().isEmpty() == true) ? "" : run.getName()));
                
                Element startTimeNode = doc.createElement("startTime");
                runNode.appendChild(startTimeNode);
                startTimeNode.appendChild(doc.createTextNode(Long.toString(run.getStartTime())));

                Element timeZone = doc.createElement("timeZone");
                runNode.appendChild(timeZone);
                timeZone.appendChild(doc.createTextNode(Long.toString(run.getTimeZone())));

                Element distanceNode = doc.createElement("distance");
                runNode.appendChild(distanceNode);
                distanceNode.appendChild(doc.createTextNode(Float.toString(run.getDistance())));
                
                Element durationNode = doc.createElement("duration");
                runNode.appendChild(durationNode);
                durationNode.appendChild(doc.createTextNode(Long.toString(run.getDuration())));
                
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
