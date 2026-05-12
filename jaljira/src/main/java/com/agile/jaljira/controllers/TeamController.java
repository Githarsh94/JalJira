package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Organization;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.UserRepository;
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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

  private static final Logger logger = LoggerFactory.getLogger(TeamController.class);

  private final TeamService teamService;
  private final UserRepository userRepository;

  public TeamController(TeamService teamService, UserRepository userRepository) {
    this.teamService = teamService;
    this.userRepository = userRepository;
  }

  /**
   * Get teams for current user's organization
   * - ADMIN: sees all teams in organization
   * - MANAGER: sees only their own team
   * - MEMBER: sees only their assigned team
   */
  @GetMapping("/org")
  public ResponseEntity<List<Map<String, Object>>> getTeamsByOrganization(Authentication auth) {
    try {
      User user = userRepository.findByEmail(auth.getName())
              .orElseThrow(() -> new IllegalArgumentException("User not found"));
      UUID orgId = user.getOrganization().getId();
      List<Team> teams = teamService.getTeamsByOrganization(orgId);
      
      // Filter teams based on user role
      if (user.getRole() != Role.ADMIN) {
        // Managers and members only see their own team
        teams = teams.stream()
                .filter(team -> team.getManager() != null && team.getManager().getId().equals(user.getId()))
                .collect(Collectors.toList());
      }
      
      List<Map<String, Object>> teamDtos = teams.stream().map(this::teamToMap).collect(Collectors.toList());
      return ResponseEntity.ok(teamDtos);
    } catch (Exception e) {
      logger.error("Error fetching teams", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Create a new team
   * ADMIN only endpoint - team created in admin's organization
   */
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Map<String, Object>> createTeam(@RequestBody Map<String, String> request, Authentication auth) {
    try {
      User admin = userRepository.findByEmail(auth.getName())
              .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
      
      Organization org = admin.getOrganization();
      if (org == null) {
        return ResponseEntity.badRequest()
                .body(Map.of("success", false, "error", "Admin must belong to an organization"));
      }

      String teamName = request.get("team_name");
      String description = request.get("description");

      if (teamName == null || teamName.isBlank()) {
        return ResponseEntity.badRequest()
            .body(Map.of("success", false, "error", "Team name is required"));
      }

      Map<String, Object> result = teamService.createTeam(org.getId(), teamName, description != null ? description : "");

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
   * Change the manager of a team (reassign from current manager to new manager)
   * ADMIN only endpoint
   * Request body should contain:
   * {
   *   "manager_email": "string"
   * }
   */
  @PostMapping("/{teamId}/change-manager")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Map<String, Object>> changeManagerToTeam(
      @PathVariable UUID teamId,
      @RequestBody Map<String, String> request,
      Authentication auth) {
    try {
      String newManagerEmail = request.get("manager_email");

      if (newManagerEmail == null || newManagerEmail.isBlank()) {
        return ResponseEntity.badRequest()
            .body(Map.of("success", false, "error", "New manager email is required"));
      }

      Map<String, Object> result = teamService.changeManagerToTeam(teamId, newManagerEmail);

      if ((boolean) result.get("success")) {
        logger.info("Manager changed for team {} by admin: {}", teamId, auth.getName());
        return ResponseEntity.ok(result);
      } else {
        logger.warn("Manager change failed: {}", result.get("error"));
        return ResponseEntity.badRequest().body(result);
      }

    } catch (Exception e) {
      logger.error("Error changing manager for team", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
    }
  }

  /**
   * Delete a team
   * ADMIN only endpoint
   */
  @DeleteMapping("/{teamId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Map<String, Object>> deleteTeam(@PathVariable UUID teamId, Authentication auth) {
    try {
      User admin = userRepository.findByEmail(auth.getName())
              .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
      
      // Verify team belongs to admin's organization
      Optional<Team> teamOpt = teamService.getTeamById(teamId);
      if (teamOpt.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "error", "Team not found"));
      }
      
      Team team = teamOpt.get();
      if (!team.getOrganization().getId().equals(admin.getOrganization().getId())) {
        logger.warn("Unauthorized team deletion attempt by admin: {}", auth.getName());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("success", false, "error", "Cannot delete team from another organization"));
      }
      
      Map<String, Object> result = teamService.deleteTeam(teamId);
      if ((boolean) result.get("success")) {
        logger.info("Team deleted by admin: {}", auth.getName());
        return ResponseEntity.ok(result);
      } else {
        return ResponseEntity.badRequest().body(result);
      }
    } catch (Exception e) {
      logger.error("Error deleting team", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("success", false, "error", "Internal server error"));
    }
  }

  /**
   * Convert Team entity to a Map to avoid circular references
   */
  private Map<String, Object> teamToMap(Team team) {
    Map<String, Object> result = new java.util.LinkedHashMap<>();
    result.put("id", team.getId().toString());
    result.put("teamName", team.getTeamName());
    result.put("description", team.getDescription() != null ? team.getDescription() : "");

    User manager = team.getManager();
    if (manager != null) {
      result.put("manager", Map.of(
          "id", manager.getId().toString(),
          "email", manager.getEmail(),
          "firstName", manager.getFirstName() != null ? manager.getFirstName() : "",
          "lastName", manager.getLastName() != null ? manager.getLastName() : ""));
    } else {
      result.put("manager", null);
    }

    if (team.getOrganization() != null) {
      result.put("organization", Map.of("id", team.getOrganization().getId().toString()));
    } else {
      result.put("organization", null);
    }

    return result;
  }
}
