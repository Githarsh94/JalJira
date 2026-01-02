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
    
    //start and end are SQL keywords, so we need to escape them
    @Column(name = "\"start\"")
    private LocalDateTime start;
    
    @Column(name = "\"end\"")
    private LocalDateTime end;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Constructors
    public Sprint() {}
    
    public Sprint(LocalDateTime start, LocalDateTime end) {
        this.start = start;
        this.end = end;
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}
