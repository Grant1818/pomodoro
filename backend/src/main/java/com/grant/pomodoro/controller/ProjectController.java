package com.grant.pomodoro.controller;
import com.grant.pomodoro.model.Project; // import the Project class
import com.grant.pomodoro.repository.ProjectRepository; // import the ProjectRepository interface
import org.springframework.beans.factory.annotation.Autowired; // allow spring to create objects
import org.springframework.web.bind.annotation.*; // import rest api annotations
import java.util.List;// Needed because findAll() returns a list


@RestController // marks this class as a REST API controller

@RequestMapping("/api/projects")// Every endpoint in this class starts with /api/projects

public class ProjectController 
{
    @Autowired // automatically creates a project repository object
    private ProjectRepository projectRepository;

    @getmapping // handles GET requests to /api/projects
    public List<Project> getAllProjects()
    {
        return projectRepository.findAll(); // returns a list of all projects in the database
    }

    @postmapping // handles POST requests to /api/projects
    public Project createProject(@RequestBody Project project)
    {
        return projectRepository.save(project); // saves the project to the database and returns the saved project
    }
    
}
