package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.services.TeamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private static final Logger logger = LoggerFactory.getLogger(TeamController.class);

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    /**
     * Get all teams for an organization
     * Accessible by authenticated users
     */
    @GetMapping("/org/{orgId}")
    public ResponseEntity<List<Map<String, Object>>> getTeamsByOrganization(@PathVariable UUID orgId) {
        try {
            List<Team> teams = teamService.getTeamsByOrganization(orgId);
            List<Map<String, Object>> teamDtos = teams.stream().map(this::teamToMap).collect(Collectors.toList());
            return ResponseEntity.ok(teamDtos);
        } catch (Exception e) {
            logger.error("Error fetching teams for organization: {}", orgId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new team
     * ADMIN only endpoint
     * Request body should contain:
     * {
     *   "team_name": "string",
     *   "description": "string",
     *   "org_id": "uuid"
     * }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createTeam(@RequestBody Map<String, String> request, Authentication auth) {
        try {
            String teamName = request.get("team_name");
            String description = request.get("description");
            String orgIdStr = request.get("org_id");

            // Validate required fields
            if (teamName == null || teamName.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Team name is required"));
            }

            if (orgIdStr == null || orgIdStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Organization ID is required"));
            }

            // Parse UUID
            UUID organizationId;
            try {
                organizationId = UUID.fromString(orgIdStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Invalid organization ID format"));
            }

            // Create team
            Map<String, Object> result = teamService.createTeam(organizationId, teamName, description != null ? description : "");

            if ((boolean) result.get("success")) {
                logger.info("Team created successfully by admin: {}", auth.getName());
                return ResponseEntity.ok(result);
            } else {
                logger.warn("Team creation failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }

        } catch (Exception e) {
            logger.error("Error creating team", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Assign a manager to a team
     * ADMIN only endpoint
     * Request body should contain:
     * {
     *   "manager_email": "string"
     * }
     */
    @PostMapping("/{teamId}/assign-manager")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> assignManagerToTeam(
            @PathVariable UUID teamId,
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            String managerEmail = request.get("manager_email");

            if (managerEmail == null || managerEmail.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Manager email is required"));
            }

            // Assign manager
            Map<String, Object> result = teamService.assignManagerToTeam(teamId, managerEmail);

            if ((boolean) result.get("success")) {
                logger.info("Manager assigned to team {} by admin: {}", teamId, auth.getName());
                return ResponseEntity.ok(result);
            } else {
                logger.warn("Manager assignment failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }

        } catch (Exception e) {
            logger.error("Error assigning manager to team", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Convert Team entity to a Map to avoid circular references
     */
    private Map<String, Object> teamToMap(Team team) {
        User manager = team.getManager();
        Map<String, Object> managerMap = null;
        if (manager != null) {
            managerMap = Map.of(
                    "id", manager.getId().toString(),
                    "email", manager.getEmail(),
                    "firstName", manager.getFirstName() != null ? manager.getFirstName() : "",
                    "lastName", manager.getLastName() != null ? manager.getLastName() : ""
            );
        }

        return Map.of(
                "id", team.getId().toString(),
                "teamName", team.getTeamName(),
                "description", team.getDescription() != null ? team.getDescription() : "",
                "manager", managerMap != null ? managerMap : Map.of(),
                "organization", team.getOrganization() != null ? 
                    Map.of("id", team.getOrganization().getId().toString()) : Map.of()
        );
    }
}
