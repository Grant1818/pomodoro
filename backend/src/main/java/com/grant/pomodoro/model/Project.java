package com.grant.pomodoro.model;
import jakarta.persistence.*;

//marks this class as a JPA entity, which means it will be mapped to a database table
@Entity
public class Project 
{
    @Id //primary key of the entity
    
    @GeneratedValue(strategy = GenerationType.IDENTITY) //auto generates the value of the primary key
    private Long id;//stores project id

    private String name; //stores project name

    private int estimatedPomodoros; //stores the estimated number of pomodoros for the project

    private int actualPomodoros; //stores the actual number of pomodoros spent on the project

    private int totalTimeSpent; //stores the total time spent on the project in minutes

    public Project() 
    {
        // Default constructor required by JPA
    }

    public Long getId() 
    {
        return id; //returns projects id
    }

    public String getName() 
    {
        return name; //returns project name
    }

    public void setName(String name) 
    {
        this.name = name; //sets project name
    }

    public int getEstimatedPomodoros() 
    {
        return estimatedPomodoros; //returns estimated number of pomodoros
    }

    public void setEstimatedPomodoros(int estimatedPomodoros) 
    {
        this.estimatedPomodoros = estimatedPomodoros; //sets estimated number of pomodoros
    }

    public int getActualPomodoros() 
    {
        return actualPomodoros; //returns actual number of pomodoros
    }

    public void setActualPomodoros(int actualPomodoros) 
    {
        this.actualPomodoros = actualPomodoros; //sets actual number of pomodoros
    }

    public int getTotalTimeSpent() 
    {
        return totalTimeSpent; //returns total time spent on the project
    }

    public void setTotalTimeSpent(int totalTimeSpent) 
    {
        this.totalTimeSpent = totalTimeSpent; //sets total time spent on the project
    }

}
