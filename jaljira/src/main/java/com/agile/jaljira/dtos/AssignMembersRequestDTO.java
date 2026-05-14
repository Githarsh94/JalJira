package com.agile.jaljira.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class AssignMembersRequestDTO {
    
    @NotEmpty(message = "Email list cannot be empty")
    private List<@Email(message = "Invalid email format") String> emails;
    
    // Constructor
    public AssignMembersRequestDTO() {}
    
    public AssignMembersRequestDTO(List<String> emails) {
        this.emails = emails;
    }
    
    // Getters and Setters
    public List<String> getEmails() {
        return emails;
    }
    
    public void setEmails(List<String> emails) {
        this.emails = emails;
    }
}
