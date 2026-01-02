package com.agile.jaljira.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

@Entity
@Table(name = "teams")
public class Team {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Team name cannot be empty or whitespace")
    @Size(max = 255, message = "Team name cannot exceed 255 characters")
    @Column(name = "team_name", nullable = false, unique = true, length = 255)
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
    
    protected void setId(UUID id) {
        this.id = id;
    }
    
    public String getTeamName() {
        return teamName;
    }
    
    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }
}
