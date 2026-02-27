package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.services.TeamService;
import com.agile.jaljira.services.UserService;
import com.agile.jaljira.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final TeamService teamService;
    private final UserService userService;
    private final UserRepository userRepository;

    public AdminController(TeamService teamService, UserService userService, UserRepository userRepository) {
        this.teamService = teamService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/teams")
    public ResponseEntity<Team> createTeam(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        User admin = userRepository.findByEmail(authentication.getName())
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
            Authentication authentication) {

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Role newRole = Role.valueOf(request.get("role"));
        User updatedUser = userService.updateUserRole(email, newRole, admin);

        return ResponseEntity.ok(updatedUser);
    }
}
