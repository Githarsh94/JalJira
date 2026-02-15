package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.services.TeamService;
import com.agile.jaljira.services.UserService;
import com.agile.jaljira.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    @Autowired
    private TeamService teamService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/teams")
    public ResponseEntity<Team> createTeam(
            @RequestBody Map<String, String> request,
            OAuth2AuthenticationToken authentication) {
        
        String email = authentication.getPrincipal().getAttribute("email");
        User admin = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        String teamName = request.get("teamName");
        UUID managerId = UUID.fromString(request.get("managerId"));
        
        Team team = teamService.createTeam(teamName, managerId, admin);
        return ResponseEntity.ok(team);
    }
    
    @PutMapping("/users/{email}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable String email,
            @RequestBody Map<String, String> request,
            OAuth2AuthenticationToken authentication) {
        
        String adminEmail = authentication.getPrincipal().getAttribute("email");
        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Role newRole = Role.valueOf(request.get("role"));
        User updatedUser = userService.updateUserRole(email, newRole, admin);
        
        return ResponseEntity.ok(updatedUser);
    }
}
