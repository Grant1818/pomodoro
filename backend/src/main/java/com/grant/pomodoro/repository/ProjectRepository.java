package com.grant.pomodoro.repository;
import com.grant.pomodoro.model.Project; // import the Project class
import org.springframework.data.jpa.repository.JpaRepository; // import JpaRepository

public interface ProjectRepository extends JpaRepository<Project, Long>
{
    // tells spring to manage entities of type Project with primary keys of type Long
}
