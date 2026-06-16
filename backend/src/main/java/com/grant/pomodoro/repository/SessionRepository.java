package com.grant.pomodoro.repository;

import com.grant.pomodoro.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessionRepository extends JpaRepository<Session, Long> {
	List<Session> findByProjectId(Long projectId);
}
