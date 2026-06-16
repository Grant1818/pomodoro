package com.grant.pomodoro.controller;

import com.grant.pomodoro.model.Project;
import com.grant.pomodoro.model.Timer;
import com.grant.pomodoro.repository.ProjectRepository;
import com.grant.pomodoro.repository.TimerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/timers")
public class TimerController {
	@Autowired
	private TimerRepository timerRepository;

	@Autowired
	private ProjectRepository projectRepository;

	@GetMapping
	public List<Timer> getAllTimers(@RequestParam(required = false) Long projectId) {
		if (projectId != null) {
			return timerRepository.findByProjectId(projectId);
		}
		return timerRepository.findAll();
	}

	@GetMapping("/{id}")
	public Timer getTimerById(@PathVariable Long id) {
		return timerRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Timer not found"));
	}

	@PostMapping
	public Timer createTimer(@RequestBody Timer timer) {
		Long projectId = timer.getProject() != null ? timer.getProject().getId() : null;
		if (projectId == null) {
			throw new RuntimeException("project.id is required");
		}

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new RuntimeException("Project not found"));
		timer.setProject(project);

		if (timer.getRemainingSeconds() == 0) {
			timer.setRemainingSeconds(timer.getWorkDurationMinutes() * 60);
		}

		return timerRepository.save(timer);
	}

	@PutMapping("/{id}")
	public Timer updateTimer(@PathVariable Long id, @RequestBody Timer updatedTimer) {
		Timer timer = timerRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Timer not found"));

		Long projectId = updatedTimer.getProject() != null ? updatedTimer.getProject().getId() : null;
		if (projectId != null) {
			Project project = projectRepository.findById(projectId)
					.orElseThrow(() -> new RuntimeException("Project not found"));
			timer.setProject(project);
		}

		timer.setWorkDurationMinutes(updatedTimer.getWorkDurationMinutes());
		timer.setBreakDurationMinutes(updatedTimer.getBreakDurationMinutes());
		timer.setRemainingSeconds(updatedTimer.getRemainingSeconds());
		timer.setRunning(updatedTimer.isRunning());
		return timerRepository.save(timer);
	}

	@DeleteMapping("/{id}")
	public void deleteTimer(@PathVariable Long id) {
		timerRepository.deleteById(id);
	}
}
