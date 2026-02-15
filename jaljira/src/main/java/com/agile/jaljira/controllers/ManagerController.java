package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.services.TeamService;
import com.agile.jaljira.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class ManagerController {
    
    @Autowired
    private TeamService teamService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/teams/{teamId}/members")
    public ResponseEntity<Team> addMemberToTeam(
            @PathVariable UUID teamId,
            @RequestBody Map<String, String> request,
            OAuth2AuthenticationToken authentication) {
        
        String email = authentication.getPrincipal().getAttribute("email");
        User manager = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        UUID memberId = UUID.fromString(request.get("memberId"));
        Team team = teamService.addMemberToTeam(teamId, memberId, manager);
        
        return ResponseEntity.ok(team);
    }
}
