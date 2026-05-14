package com.agile.jaljira.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;

public class CreateTaskStatusRequestDTO {
    
    @NotEmpty(message = "Status type is required")
    @JsonProperty("status_type")
    private String statusType;
    
    private String description;
    
    public CreateTaskStatusRequestDTO() {}
    
    public CreateTaskStatusRequestDTO(String statusType, String description) {
        this.statusType = statusType;
        this.description = description;
    }
    
    public String getStatusType() {
        return statusType;
    }
    
    public void setStatusType(String statusType) {
        this.statusType = statusType;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}
