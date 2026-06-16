package com.grant.pomodoro.controller;

import com.grant.pomodoro.model.Project;
import com.grant.pomodoro.model.Session;
import com.grant.pomodoro.repository.ProjectRepository;
import com.grant.pomodoro.repository.SessionRepository;
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
@RequestMapping("/api/sessions")
public class SessionControllr {
	@Autowired
	private SessionRepository sessionRepository;

	@Autowired
	private ProjectRepository projectRepository;

	@GetMapping
	public List<Session> getAllSessions(@RequestParam(required = false) Long projectId) {
		if (projectId != null) {
			return sessionRepository.findByProjectId(projectId);
		}
		return sessionRepository.findAll();
	}

	@GetMapping("/{id}")
	public Session getSessionById(@PathVariable Long id) {
		return sessionRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Session not found"));
	}

	@PostMapping
	public Session createSession(@RequestBody Session session) {
		Long projectId = session.getProject() != null ? session.getProject().getId() : null;
		if (projectId == null) {
			throw new RuntimeException("project.id is required");
		}

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new RuntimeException("Project not found"));
		session.setProject(project);
		return sessionRepository.save(session);
	}

	@PutMapping("/{id}")
	public Session updateSession(@PathVariable Long id, @RequestBody Session updatedSession) {
		Session session = sessionRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Session not found"));

		Long projectId = updatedSession.getProject() != null ? updatedSession.getProject().getId() : null;
		if (projectId != null) {
			Project project = projectRepository.findById(projectId)
					.orElseThrow(() -> new RuntimeException("Project not found"));
			session.setProject(project);
		}

		session.setDurationMinutes(updatedSession.getDurationMinutes());
		session.setStatus(updatedSession.getStatus());
		return sessionRepository.save(session);
	}

	@DeleteMapping("/{id}")
	public void deleteSession(@PathVariable Long id) {
		sessionRepository.deleteById(id);
	}
}
