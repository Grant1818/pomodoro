package com.grant.pomodoro.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Timer {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "project_id")
	private Project project;

	private int workDurationMinutes = 25;

	private int breakDurationMinutes = 5;

	private int remainingSeconds;

	private boolean running;

	public Timer() {
	}

	public Long getId() {
		return id;
	}

	public Project getProject() {
		return project;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public int getWorkDurationMinutes() {
		return workDurationMinutes;
	}

	public void setWorkDurationMinutes(int workDurationMinutes) {
		this.workDurationMinutes = workDurationMinutes;
	}

	public int getBreakDurationMinutes() {
		return breakDurationMinutes;
	}

	public void setBreakDurationMinutes(int breakDurationMinutes) {
		this.breakDurationMinutes = breakDurationMinutes;
	}

	public int getRemainingSeconds() {
		return remainingSeconds;
	}

	public void setRemainingSeconds(int remainingSeconds) {
		this.remainingSeconds = remainingSeconds;
	}

	public boolean isRunning() {
		return running;
	}

	public void setRunning(boolean running) {
		this.running = running;
	}
}
