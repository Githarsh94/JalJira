package com.agile.jaljira.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sprints")
public class Sprint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "start")
    private LocalDateTime start;
    
    @Column(name = "end")
    private LocalDateTime end;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sprint_status")
    private SprintStatus sprintStatus;
    
    // Constructors
    public Sprint() {}
    
    public Sprint(LocalDateTime start, LocalDateTime end, SprintStatus sprintStatus) {
        this.start = start;
        this.end = end;
        this.sprintStatus = sprintStatus;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public LocalDateTime getStart() {
        return start;
    }
    
    public void setStart(LocalDateTime start) {
        this.start = start;
    }
    
    public LocalDateTime getEnd() {
        return end;
    }
    
    public void setEnd(LocalDateTime end) {
        this.end = end;
    }
    
    public SprintStatus getSprintStatus() {
        return sprintStatus;
    }
    
    public void setSprintStatus(SprintStatus sprintStatus) {
        this.sprintStatus = sprintStatus;
    }
}
