package com.artxgj.cloudtabularium;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import org.datanucleus.jpa.annotations.Extension;

import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;

@Entity
public class RunGeolocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)    
    private Key id;

    // Geolocation API data
    private float latitude;
    private float longitude;
    private float accuracy;
    private float altitude;
    private float altitudeAccuracy;
    private float heading;
    private float speed;
    private long  gpsTimestamp;

    // cumulative run statistics at current location
    private long  duration;  
    private float distance;  
    
    @ManyToOne(fetch = FetchType.LAZY)
    private RunWorkout runWorkout;
    
    public Key getId() {
        return id;
    }

    public float getLatitude() {
    	return latitude; 
    }

    public void setLatitude(float val) {
    	latitude = val; 
    }
    
    public float getLongitude() {
    	return longitude;
    }

    public void setLongitude(float val) {
    	longitude = val;
    }
    
    public float getAccuracy() {
    	return accuracy;
    }
    
    public void setAccuracy(float val) {
    	accuracy = val;
    }
    
    public float getAltitude() {
    	return altitude;
    }

    public void setAltitude(float val) {
    	altitude = val;
    }
    
    public float getAltitudeAccuracy() {
    	return altitudeAccuracy;
    }

    public void setAltitudeAccuracy(float val) {
    	altitudeAccuracy = val;
    }
    

    public float getHeading() {
    	return heading;
    }
    
    public void setHeading(float val) {
    	heading = val;
    }
    
    public float getSpeed() {
    	return speed;
    }
    
    public void setSpeed(float val) {
    	speed = val;
    }
    
    public long getGpsTimestamp() {
    	return gpsTimestamp;
    }
    
    public void setGpsTimestamp(long val) {
    	gpsTimestamp = val;
    }
    
    public long getDuration() {
    	return duration;
    }
    
    public void setDuration(long val) {
    	duration = val;
    }
    
    public float getDistance() {
    	return distance;
    }
    
    public void setDistance(float val) {
    	distance = val;
    }
    
    public RunWorkout getRun() {
    	return runWorkout;
    }
}