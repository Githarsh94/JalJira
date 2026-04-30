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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_template_id", nullable = false)
    private SprintTemplate sprintTemplate;
    
    //start and end are SQL keywords, so we need to escape them
    @Column(name = "\"start\"", nullable = false)
    private LocalDateTime start;
    
    @Column(name = "\"end\"", nullable = false)
    private LocalDateTime end;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Sprint() {}
    
    public Sprint(Organization organization, SprintTemplate sprintTemplate, LocalDateTime start, LocalDateTime end) {
        this.organization = organization;
        this.sprintTemplate = sprintTemplate;
        this.start = start;
        this.end = end;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public Organization getOrganization() {
        return organization;
    }
    
    public void setOrganization(Organization organization) {
        this.organization = organization;
    }
    
    public SprintTemplate getSprintTemplate() {
        return sprintTemplate;
    }
    
    public void setSprintTemplate(SprintTemplate sprintTemplate) {
        this.sprintTemplate = sprintTemplate;
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
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
