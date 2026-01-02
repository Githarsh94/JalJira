package com.agile.jaljira.models;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "task_status")
public class TaskStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "status_type")
    private String statusType;
    
    // Constructors
    public TaskStatus() {}
    
    public TaskStatus(String statusType) {
        this.statusType = statusType;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    protected void setId(UUID id) {
        this.id = id;
    }
    
    public String getStatusType() {
        return statusType;
    }
    
    public void setStatusType(String statusType) {
        this.statusType = statusType;
    }
}
