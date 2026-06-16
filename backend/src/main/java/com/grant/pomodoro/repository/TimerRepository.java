package com.grant.pomodoro.repository;

import com.grant.pomodoro.model.Timer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimerRepository extends JpaRepository<Timer, Long> {
	List<Timer> findByProjectId(Long projectId);
}
