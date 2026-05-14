package com.agile.jaljira.services;

import com.agile.jaljira.models.Organization;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.models.Team;
import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.OrganizationRepository;
import com.agile.jaljira.repositories.TeamRepository;
import com.agile.jaljira.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class TeamService {

  private static final Logger logger = LoggerFactory.getLogger(TeamService.class);

  private final TeamRepository teamRepository;
  private final UserRepository userRepository;
  private final OrganizationRepository organizationRepository;
  private final EmailService emailService;

  public TeamService(TeamRepository teamRepository,
      UserRepository userRepository,
      OrganizationRepository organizationRepository,
      EmailService emailService) {
    this.teamRepository = teamRepository;
    this.userRepository = userRepository;
    this.organizationRepository = organizationRepository;
    this.emailService = emailService;
  }

  /**
   * Create a new team in an organization
   */
  @Transactional
  public Map<String, Object> createTeam(UUID organizationId, String teamName, String description) {
    Optional<Organization> orgOpt = organizationRepository.findById(organizationId);
    if (orgOpt.isEmpty()) {
      logger.warn("Organization not found: {}", organizationId);
      return Map.of("success", false, "error", "Organization not found");
    }

    Organization organization = orgOpt.get();

    Team team = new Team(teamName, description, organization);
    Team savedTeam = teamRepository.save(team);

    logger.info("Team created: id={}, name={}, org_id={}", savedTeam.getId(), teamName, organizationId);

    return Map.of(
        "success", true,
        "message", "Team created successfully",
        "team_id", savedTeam.getId().toString(),
        "team_name", savedTeam.getTeamName(),
        "description", savedTeam.getDescription() != null ? savedTeam.getDescription() : "");
  }

  /**
   * Get all teams for an organization
   */
  public List<Team> getTeamsByOrganization(UUID organizationId) {
    logger.debug("Fetching teams for organization: {}", organizationId);
    return teamRepository.findByOrganization_Id(organizationId);
  }

  /**
   * Get team by ID
   */
  public Optional<Team> getTeamById(UUID teamId) {
    return teamRepository.findById(teamId);
  }

  /**
   * Assign a manager to a team
   * If manager with given email doesn't exist, create a pending manager user
   */
  @Transactional
  public Map<String, Object> assignManagerToTeam(UUID teamId, String managerEmail) {
    Optional<Team> teamOpt = teamRepository.findById(teamId);
    if (teamOpt.isEmpty()) {
      logger.warn("Team not found: {}", teamId);
      return Map.of("success", false, "error", "Team not found");
    }

    Team team = teamOpt.get();
    Organization organization = team.getOrganization();

    if (organization == null) {
      logger.error("Team {} has no organization assigned", teamId);
      return Map.of("success", false, "error", "Team organization not found");
    }

    if (team.getManager() != null) {
      logger.warn("Team {} already has a manager assigned", teamId);
      return Map.of("success", false, "error", "This team already has a manager");
    }

    if (managerEmail == null || managerEmail.isBlank()) {
      return Map.of("success", false, "error", "Manager email is required");
    }

    User manager;
    boolean isNewManager = false;

    Optional<User> existingUser = userRepository.findByEmail(managerEmail);

    if (existingUser.isPresent()) {
      manager = existingUser.get();
      // Validate organization match for existing user
      if (manager.getOrganization() != null && !manager.getOrganization().getId().equals(organization.getId())) {
        logger.warn("User {} belongs to a different organization", managerEmail);
        return Map.of("success", false, "error", "User belongs to a different organization and cannot be assigned");
      }
      Optional<Team> existingTeam = teamRepository.findByManager_Id(manager.getId());
      if (existingTeam.isPresent()) {
        logger.warn("User {} is already a manager of team {}", managerEmail, existingTeam.get().getId());
        return Map.of("success", false, "error", "This user is already a manager of another team");
      }
      logger.info("Using existing user as manager: {}, isOnboarded={}", managerEmail, manager.isOnboarded());
    } else {
      manager = new User();
      manager.setEmail(managerEmail);
      manager.setRole(Role.MANAGER);
      manager.setOnboarded(false);
      manager.setOrganization(organization);
      manager = userRepository.save(manager);
      isNewManager = true;
      logger.info("Created new pending manager user: {}, isOnboarded=false", managerEmail);
    }

    team.setManager(manager);
    manager.setTeam(team);
    // Only set organization for new users; existing users retain their organization
    if (manager.getOrganization() == null) {
      manager.setOrganization(organization);
    }

    teamRepository.save(team);
    userRepository.save(manager);

    logger.info("Manager {} assigned to team {}", managerEmail, teamId);

    boolean emailSent = emailService.sendManagerInvitation(
        manager.getEmail(),
        manager.getFirstName() != null ? manager.getFirstName() : "",
        team.getTeamName(),
        organization.getOrganisationName());

    Map<String, Object> response = new java.util.HashMap<>();
    response.put("success", true);
    response.put("manager_id", manager.getId().toString());
    response.put("manager_email", managerEmail);
    response.put("team_id", teamId.toString());
    response.put("is_new_manager", isNewManager);

    if (!emailSent) {
      response.put("warning", "Manager assigned successfully, but invitation email delivery failed. Please manually notify the manager.");
      response.put("message", isNewManager ? "Manager invitation created but email delivery failed." : "Manager assigned but email delivery failed.");
      logger.warn("Email delivery failed for manager invitation to: {}", managerEmail);
    } else {
      response.put("message", isNewManager ? "Manager invited successfully. Invitation email sent." : "Manager assigned successfully.");
    }

    return response;
  }

  /**
   * Change the manager of a team (reassign from current manager to new manager)
   * If new manager doesn't exist, create a pending manager user
   */
  @Transactional
  public Map<String, Object> changeManagerToTeam(UUID teamId, String newManagerEmail) {
    Optional<Team> teamOpt = teamRepository.findById(teamId);
    if (teamOpt.isEmpty()) {
      logger.warn("Team not found: {}", teamId);
      return Map.of("success", false, "error", "Team not found");
    }

    Team team = teamOpt.get();
    Organization organization = team.getOrganization();

    if (organization == null) {
      logger.error("Team {} has no organization assigned", teamId);
      return Map.of("success", false, "error", "Team organization not found");
    }

    if (team.getManager() == null) {
      logger.warn("Team {} has no current manager to replace", teamId);
      return Map.of("success", false, "error", "This team has no manager to replace");
    }

    User currentManager = team.getManager();
    logger.info("Current manager: {}", currentManager.getEmail());

    if (newManagerEmail == null || newManagerEmail.isBlank()) {
      return Map.of("success", false, "error", "New manager email is required");
    }

    if (currentManager.getEmail().equalsIgnoreCase(newManagerEmail)) {
      return Map.of("success", false, "error", "New manager must be different from current manager");
    }

    User newManager;
    boolean isNewManager = false;

    Optional<User> existingUser = userRepository.findByEmail(newManagerEmail);

    if (existingUser.isPresent()) {
      newManager = existingUser.get();
      // Validate organization match for existing user
      if (newManager.getOrganization() != null && !newManager.getOrganization().getId().equals(organization.getId())) {
        logger.warn("User {} belongs to a different organization", newManagerEmail);
        return Map.of("success", false, "error", "User belongs to a different organization and cannot be assigned");
      }
      Optional<Team> existingTeam = teamRepository.findByManager_Id(newManager.getId());
      if (existingTeam.isPresent() && !existingTeam.get().getId().equals(teamId)) {
        logger.warn("User {} is already a manager of team {}", newManagerEmail, existingTeam.get().getId());
        return Map.of("success", false, "error", "This user is already a manager of another team");
      }
      logger.info("Using existing user as new manager: {}, isOnboarded={}", newManagerEmail, newManager.isOnboarded());
    } else {
      newManager = new User();
      newManager.setEmail(newManagerEmail);
      newManager.setRole(Role.MANAGER);
      newManager.setOnboarded(false);
      newManager.setOrganization(organization);
      newManager = userRepository.save(newManager);
      isNewManager = true;
      logger.info("Created new pending manager user: {}, isOnboarded=false", newManagerEmail);
    }

    // Demote previous manager to MEMBER role
    currentManager.setRole(Role.MEMBER);
    logger.info("Previous manager {} demoted to MEMBER role", currentManager.getEmail());

    // Assign new manager to team
    team.setManager(newManager);
    newManager.setTeam(team);
    newManager.setRole(Role.MANAGER);
    // Only set organization for new users; existing users retain their organization
    if (newManager.getOrganization() == null) {
      newManager.setOrganization(organization);
    }

    teamRepository.save(team);
    userRepository.save(currentManager);
    userRepository.save(newManager);

    logger.info("Manager changed from {} to {} for team {}", currentManager.getEmail(), newManagerEmail, teamId);

    boolean emailSent = emailService.sendManagerInvitation(
        newManager.getEmail(),
        newManager.getFirstName() != null ? newManager.getFirstName() : "",
        team.getTeamName(),
        organization.getOrganisationName());

    Map<String, Object> response = new java.util.HashMap<>();
    response.put("success", true);
    response.put("old_manager_id", currentManager.getId().toString());
    response.put("old_manager_email", currentManager.getEmail());
    response.put("new_manager_id", newManager.getId().toString());
    response.put("new_manager_email", newManagerEmail);
    response.put("team_id", teamId.toString());
    response.put("is_new_manager", isNewManager);

    if (!emailSent) {
      response.put("warning", "Manager changed successfully, but invitation email delivery failed. Please manually notify the new manager.");
      response.put("message", isNewManager
          ? "Manager changed but invitation email delivery failed."
          : "Manager changed but email delivery failed.");
      logger.warn("Email delivery failed for manager invitation to: {}", newManagerEmail);
    } else {
      response.put("message", isNewManager
          ? "Manager changed successfully. Invitation email sent to new manager."
          : "Manager changed successfully.");
    }

    return response;
  }

  /**
   * Assign members to a team by email addresses
   * Skips emails that already exist in the team, creates new users for new emails
   */
  @Transactional
  public List<User> assignMembersToTeam(UUID teamId, List<String> emails) {
    Optional<Team> teamOpt = teamRepository.findById(teamId);
    if (teamOpt.isEmpty()) {
      logger.warn("Team not found: {}", teamId);
      return List.of();
    }

    Team team = teamOpt.get();
    List<User> newUsers = new java.util.ArrayList<>();

    for (String email : emails) {
      // Check if user already exists with this email + teamId combination
      Optional<User> existingUser = userRepository.findByEmailAndTeam_Id(email, teamId);
      
      if (existingUser.isPresent()) {
        logger.debug("User with email {} already exists in team {}, skipping", email, teamId);
        continue;
      }

      // Create new user
      User newUser = new User();
      newUser.setEmail(email);
      newUser.setRole(Role.MEMBER);
      newUser.setTeam(team);
      newUser.setOrganization(team.getOrganization());
      newUser.setOnboarded(false);

      User savedUser = userRepository.save(newUser);
      newUsers.add(savedUser);
      logger.info("New member assigned to team {}: email={}, user_id={}", teamId, email, savedUser.getId());
    }

    logger.info("Assigned {} new members to team {}", newUsers.size(), teamId);
    return newUsers;
  }

  /**
   * Delete a team by ID
   */
  @Transactional
  public Map<String, Object> deleteTeam(UUID teamId) {
    Optional<Team> teamOpt = teamRepository.findById(teamId);
    if (teamOpt.isEmpty()) {
      logger.warn("Team not found: {}", teamId);
      return Map.of("success", false, "error", "Team not found");
    }

    Team team = teamOpt.get();
    String teamName = team.getTeamName();
    
    // Find all users in this team and clear their team reference
    List<User> teamUsers = userRepository.findByTeamId(teamId);
    for (User user : teamUsers) {
      user.setTeam(null);
      if (user.getRole() == Role.MANAGER) {
        user.setRole(Role.MEMBER);
        logger.info("Manager {} demoted to MEMBER after team deletion", user.getEmail());
      }
      userRepository.save(user);
    }
    
    teamRepository.delete(team);
    logger.info("Team deleted: id={}, name={}, affected_users={}", teamId, teamName, teamUsers.size());
    
    return Map.of(
        "success", true,
        "message", "Team deleted successfully",
        "team_id", teamId.toString(),
        "team_name", teamName
    );
  }
}
