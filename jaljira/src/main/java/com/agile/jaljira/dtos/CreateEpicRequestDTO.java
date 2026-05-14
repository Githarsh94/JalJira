package com.agile.jaljira.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;

import java.util.UUID;

public class CreateEpicRequestDTO {
    
    @NotEmpty(message = "Epic title is required")
    private String title;
    
    private String description;
    
    @JsonProperty("sprint_id")
    private UUID sprintId; // Optional - backend will auto-select active sprint if null
    
    public CreateEpicRequestDTO() {}
    
    public CreateEpicRequestDTO(String title, String description, UUID sprintId) {
        this.title = title;
        this.description = description;
        this.sprintId = sprintId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public UUID getSprintId() {
        return sprintId;
    }
    
    public void setSprintId(UUID sprintId) {
        this.sprintId = sprintId;
    }
}
