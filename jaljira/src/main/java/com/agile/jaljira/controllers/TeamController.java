package com.agile.jaljira.controllers;

import com.agile.jaljira.dtos.AssignMembersRequestDTO;
import com.agile.jaljira.models.Organization;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.UserRepository;
import com.agile.jaljira.services.EmailService;
import com.agile.jaljira.services.TeamService;
import jakarta.validation.Valid;
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
  private final EmailService emailService;

  public TeamController(TeamService teamService, UserRepository userRepository, EmailService emailService) {
    this.teamService = teamService;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  /**
   * Get teams for current user's organization
   * All authenticated users can see teams in their organization and their members
   * Permission checks for modifications (create, delete, assign) are handled at endpoint level
   */
  @GetMapping("/org")
  public ResponseEntity<List<Map<String, Object>>> getTeamsByOrganization(Authentication auth) {
    try {
      User user = userRepository.findByEmail(auth.getName())
              .orElseThrow(() -> new IllegalArgumentException("User not found"));
      UUID orgId = user.getOrganization().getId();
      List<Team> teams = teamService.getTeamsByOrganization(orgId);
      
      logger.info("User {} (role: {}) fetching {} teams for organization {}", 
          user.getEmail(), user.getRole(), teams.size(), orgId);
      
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
   * Assign multiple members to a team by email addresses
   * MANAGER only - manager can add members to their team
   */
  @PostMapping("/{teamId}/assign-members")
  @PreAuthorize("hasRole('MANAGER')")
  public ResponseEntity<Map<String, Object>> assignMembersToTeam(
      @PathVariable UUID teamId,
      @Valid @RequestBody AssignMembersRequestDTO request,
      Authentication auth) {
    try {
      // Validate team exists
      Optional<Team> teamOpt = teamService.getTeamById(teamId);
      if (teamOpt.isEmpty()) {
        logger.warn("Team not found: {}", teamId);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("success", false, "error", "Team not found"));
      }

      Team team = teamOpt.get();
      User currentUser = userRepository.findByEmail(auth.getName())
          .orElseThrow(() -> new IllegalArgumentException("User not found"));

      // Verify user is the manager of the team
      if (team.getManager() == null || !team.getManager().getId().equals(currentUser.getId())) {
        logger.warn("User {} attempted to assign members to team {} they don't manage", auth.getName(), teamId);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("success", false, "error", "You can only manage your own team"));
      }

      // Assign members to team
      List<User> newUsers = teamService.assignMembersToTeam(teamId, request.getEmails());

      // Send invitation emails to newly added members
      if (!newUsers.isEmpty()) {
        emailService.sendTeamInviteEmails(newUsers, teamId);
      }

      logger.info("Successfully assigned {} members to team {} by manager {}", 
          newUsers.size(), teamId, auth.getName());
      return ResponseEntity.ok(Map.of(
          "success", true,
          "message", newUsers.size() + " member(s) invited successfully",
          "addedMembers", newUsers.size()
      ));

    } catch (IllegalArgumentException e) {
      logger.error("Validation error while assigning members: {}", e.getMessage());
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("success", false, "error", e.getMessage()));
    } catch (Exception e) {
      logger.error("Error assigning members to team {}: {}", teamId, e.getMessage(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("success", false, "error", "Internal server error"));
    }
  }

  /**
   * Assign One member to a team
   */
  @PostMapping("/{teamId}/assign-member")
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  public ResponseEntity<Map<String, Object>> assignMemberToTeam(
      @PathVariable UUID teamId,
      @RequestBody Map<String, String> request,
      Authentication auth) {
    try {
      String memberEmail = request.get("email");
      if (memberEmail == null || memberEmail.isBlank()) {
        return ResponseEntity.badRequest()
            .body(Map.of("success", false, "error", "Email is required"));
      }

      Optional<Team> teamOpt = teamService.getTeamById(teamId);
      if (teamOpt.isEmpty()) {
        logger.warn("Team not found: {}", teamId);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("success", false, "error", "Team not found"));
      }

      Team team = teamOpt.get();
      List<User> newUsers = teamService.assignMembersToTeam(teamId, List.of(memberEmail));

      if (newUsers.isEmpty()) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Member already exists in team",
            "addedMembers", 0
        ));
      }

      emailService.sendTeamInviteEmails(newUsers, teamId);
      logger.info("Member {} assigned to team {} by {}", memberEmail, teamId, auth.getName());
      return ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Member invited successfully",
          "addedMembers", 1
      ));

    } catch (Exception e) {
      logger.error("Error assigning member to team {}: {}", teamId, e.getMessage(), e);
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

    // Add team members (all users assigned to team, onboarded or not)
    List<User> members = userRepository.findAllByTeam_Id(team.getId());
    logger.info("Team {} has {} total members before filtering", team.getTeamName(), members.size());
    
    List<Map<String, Object>> memberList = members.stream()
        .map(user -> {
          Map<String, Object> memberMap = new java.util.LinkedHashMap<>();
          memberMap.put("id", user.getId().toString());
          memberMap.put("email", user.getEmail());
          memberMap.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
          memberMap.put("lastName", user.getLastName() != null ? user.getLastName() : "");
          memberMap.put("role", user.getRole().name());
          memberMap.put("onboarded", user.isOnboarded());
          return memberMap;
        })
        .collect(Collectors.toList());
    
    logger.info("Team {} returning {} members in response", team.getTeamName(), memberList.size());
    result.put("members", memberList);

    return result;
  }

}
