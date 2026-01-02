package com.agile.jaljira.models;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "types")
public class Type {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private String label;
    
    // Constructors
    public Type() {}
    
    public Type(String label) {
        this.label = label;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    protected void setId(UUID id) {
        this.id = id;
    }
    
    public String getLabel() {
        return label;
    }
    
    public void setLabel(String label) {
        this.label = label;
    }
}
