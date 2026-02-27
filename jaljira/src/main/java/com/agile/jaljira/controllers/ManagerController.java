package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.services.TeamService;
import com.agile.jaljira.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class ManagerController {

    private final TeamService teamService;
    private final UserRepository userRepository;

    public ManagerController(TeamService teamService, UserRepository userRepository) {
        this.teamService = teamService;
        this.userRepository = userRepository;
    }

    @PostMapping("/teams/{teamId}/members")
    public ResponseEntity<Team> addMemberToTeam(
            @PathVariable UUID teamId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        User manager = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UUID memberId = UUID.fromString(request.get("memberId"));
        Team team = teamService.addMemberToTeam(teamId, memberId, manager);

        return ResponseEntity.ok(team);
    }
}
