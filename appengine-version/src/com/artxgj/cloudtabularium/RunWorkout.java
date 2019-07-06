package com.artxgj.cloudtabularium;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.Logger;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.Id;
import javax.persistence.NoResultException;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Query;

import org.datanucleus.jpa.annotations.Extension;

import com.artxgj.cloudtabularium.RunGeolocation;
import com.google.appengine.api.datastore.KeyFactory;

@Entity
public class RunWorkout implements Workout{
    private static final Logger log = Logger.getLogger(RunWorkout.class.getName());
	
    @Id
    @Extension(vendorName = "datanucleus", key="gae.encoded-pk", value="true")
    private String id;
    private String owner;  // the runner
    private Date   startTime; // UTC milliseconds
    private int    timeZone;
    private Float  distance;  // meters 
    private Long   duration;   // milliseconds
    private String name; // name of Run Workout
    private Float  calories;  // calories burned
    private Float  airTemperature;
    private Float  preRunWeight;
    private Float  postRunWeight;
    private String terrain;
    private String notes;
    private String runGroup;
    
    @OneToMany(cascade=CascadeType.ALL,mappedBy="runWorkout")
    @OrderBy("duration ASC")
    private List<RunGeolocation> runGeos = new ArrayList<RunGeolocation>();

    public static class Builder {
        private String owner;      // the runner, for now use email address,
        private long   startTime;  // UTC milliseconds
        private int    timeZone;
        private float  distance;   // meters 
        private long   duration;   // milliseconds
        private String name;       // name of Run workout
        private float  calories;   // calories burned
        private float  airTemperature;
        private String terrain;
        private String notes;
        private String runGroup;
        private float  preRunWeight;
        private float  postRunWeight;

        
        public Builder(String owner, long startTime) {
			// TODO Auto-generated constructor stub
        	this.owner = owner;
        	this.startTime = startTime;
		}


        public Builder airTemperature(float val) {
        	airTemperature = val;
        	return this;
        }

        public Builder calories(float val) {
        	this.calories = val;
        	return this;
        }
        
        public Builder distance(float val) {
        	distance = val;
        	return this;
        }

        public Builder duration(long val) {
        	duration = val;
        	return this;
        }

        
        public Builder name(String val) {
        	name = new String(val);
        	return this;
        }
        
        
        public Builder notes(String val) {
        	notes = new String(val);
        	return this;
        }

        public Builder timeZone(int val) {
        	timeZone = val;
        	return this;
        }
        
        public RunWorkout build() {
        	return new RunWorkout(this);
        }
    }
    
    private RunWorkout(Builder build) {
    	id = createKey(build.owner, Long.toString(build.startTime));
    	owner = build.owner;
    	startTime = new Date(build.startTime);
    	timeZone = build.timeZone;
    	distance = build.distance;
    	duration = build.duration;
    	name = build.name;
    	calories = build.calories;
    	airTemperature = build.airTemperature;
    	terrain = build.terrain;
    	notes = build.notes;
    	preRunWeight = build.preRunWeight;
    	postRunWeight = build.postRunWeight;
    	runGroup = build.runGroup;
    }
    
    
    public float getAirTemperature() {
    	return airTemperature;   // celsius
    }
    
    public float getCalories() {
    	return calories;
    }
    
    public float getDistance() {
    	return distance;
    }

    public long getDuration() {
        return duration;   // milliseconds
    }
    
    public String getId() {
        return id;
    }


    public String getName() {
    	return name;
    }

    
    public String getNotes() {
    	return notes;
    }

    
    public String getOwner() {
        return owner;
    }

    public float getPreRunWeight() {
    	return preRunWeight;
    }
    
    
    public float getPostRunWeight() {
    	return postRunWeight;
    }
    
    public String getRunGroup() {
    	return runGroup;
    }

    public long getStartTime() {
    	return startTime.getTime();
    }
    
    public String getTerrain() {
    	return terrain;
    }

	public int  getTimeZone()  {
		return timeZone;
	}
	
    public void setAirTemperature(float val) {
    	airTemperature = val;
    }
    
    public void setCalories(float val) {
    	calories = val;
    }
    
	public void setDistance(float val) {
    	distance = val;
    }

    public void setDuration(long val) {
        duration = val;   // milliseconds
    }
    
    public void setName(String val) {
    	name = new String(val);
    }

    public void setNotes(String val) {
    	notes = new String(val);
    }

    public void setPreRunWeight(float val) {
    	preRunWeight = val;
    }
    
    
    public void setPostRunWeight(float val) {
    	postRunWeight = val;
    }
    
    public void setStartTime(long val) {
    	startTime = new Date(val);
    }
    
    public void setTerrain(String val) {
    	terrain = new String(val);
    }

	public void setTimeZone(int val) {
		timeZone = val;
	}
	
	public void setRunGroup(String val) {
		runGroup = val;
	}
    
	public List<RunGeolocation> getRunGeos() {
		return runGeos;
	}
	

	
	public static String createKey(String user, String startTime) {
    	KeyFactory.Builder keyBuilder = new KeyFactory.Builder(
    					RunWorkout.class.getSimpleName(), user + "-" + startTime);
    
    	return KeyFactory.keyToString(keyBuilder.getKey());
	}
}


