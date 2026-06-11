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

    @GetMapping // handles GET requests to /api/projects
    public List<Project> getAllProjects()
    {
        return projectRepository.findAll(); // returns a list of all projects in the database
    }

    @PostMapping // handles POST requests to /api/projects
    public Project createProject(@RequestBody Project project)
    {
        return projectRepository.save(project); // saves the project to the database and returns the saved project
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable Long id)
    {
        return projectRepository.findById(id) .orElseThrow(() -> new RuntimeException("Project not found"));
    }       

    @PutMapping("/{id}/completePomodoro") // handles PUT requests to /api/projects/{id}/completePomodoro
    public Project completePomodoro(@PathVariable Long id) 
    {
        // Look up the project in the database using its ID.
        // If no project exists with that ID, throw an exception.
        Project project = projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
        // Get the current actualPomodoros value,
        // add 1 because a Pomodoro session was completed,
        // then save the new value into the object.
        project.setActualPomodoros(project.getActualPomodoros() + 1);
        // Get the current totalTimeSpent value,
        // add 25 minutes because one Pomodoro was completed,
        // then save the new value into the object.
        project.setTotalTimeSpent(project.getTotalTimeSpent() + 25);
        //save the updated project back to the database and return the updated project as json
        return projectRepository.save(project);
    }

    @DeleteMapping("/{id}") // handles DELETE requests to /api/projects/{id}
    public void deleteProject(@PathVariable Long id)
    {
        projectRepository.deleteById(id); // deletes the project with the specified id from the database
    }

    @PutMapping("/{id}") // handles PUT requests to /api/projects/{id}
    public Project updateProject(@PathVariable Long id, @RequestBody Project updatedProject)
    {
        // Look up the project in the database using its ID.
        // If no project exists with that ID, throw an exception.
        Project project = projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
        // Update the project's name, estimatedPomodoros
        // with the values from the updatedProject object sent in the request body.
        project.setName(updatedProject.getName());
        project.setEstimatedPomodoros(updatedProject.getEstimatedPomodoros());
        return projectRepository.save(project);
    }

}
