package com.artxgj.cloudtabularium;

public interface Workout {
	String getName();
	long getDuration();     // milliseconds
	long getStartTime();    // UTC milliseconds
	int  getTimeZone();
	String  getOwner();
	
	void setName(String val);
	void setDuration(long val);
	void setTimeZone(int val);
}
