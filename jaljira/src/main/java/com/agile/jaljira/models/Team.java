package com.agile.jaljira.models;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "teams")
public class Team {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "team_name", nullable = false)
    private String teamName;
    
    // Constructors
    public Team() {}
    
    public Team(String teamName) {
        this.teamName = teamName;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getTeamName() {
        return teamName;
    }
    
    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }
}
