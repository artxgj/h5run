package com.artxgj.cloudtabularium;

public class MyUtils {

	private MyUtils() {};
	
	public static String nullEmptyToZero(String str) {
		return str == null || str.equals("null") || str.isEmpty()  ? "0" : str;
	}
	
	public static String nullToEmpty(String str) {
		return str == null || str.equals("null") ? "" : str; 
	}
}
