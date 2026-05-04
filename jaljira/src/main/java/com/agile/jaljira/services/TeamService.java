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
        // Validate organization exists
        Optional<Organization> orgOpt = organizationRepository.findById(organizationId);
        if (orgOpt.isEmpty()) {
            logger.warn("Organization not found: {}", organizationId);
            return Map.of("success", false, "error", "Organization not found");
        }

        Organization organization = orgOpt.get();

        // Create team
        Team team = new Team(teamName, description, organization);
        Team savedTeam = teamRepository.save(team);

        logger.info("Team created: id={}, name={}, org_id={}", savedTeam.getId(), teamName, organizationId);

        return Map.of(
            "success", true,
            "message", "Team created successfully",
            "team_id", savedTeam.getId().toString(),
            "team_name", savedTeam.getTeamName(),
            "description", savedTeam.getDescription() != null ? savedTeam.getDescription() : ""
        );
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
        // Validate team exists
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

        // Check if a manager is already assigned to this team
        if (team.getManager() != null) {
            logger.warn("Team {} already has a manager assigned", teamId);
            return Map.of("success", false, "error", "This team already has a manager");
        }

        // Validate email
        if (managerEmail == null || managerEmail.isBlank()) {
            return Map.of("success", false, "error", "Manager email is required");
        }

        User manager;
        boolean isNewManager = false;

        // Check if user with this email already exists
        Optional<User> existingUser = userRepository.findByEmail(managerEmail);

        if (existingUser.isPresent()) {
            manager = existingUser.get();
            // Validate that existing user is not already a manager of another team
            Optional<Team> existingTeam = teamRepository.findByManager_Id(manager.getId());
            if (existingTeam.isPresent()) {
                logger.warn("User {} is already a manager of team {}", managerEmail, existingTeam.get().getId());
                return Map.of("success", false, "error", "This user is already a manager of another team");
            }
            logger.info("Using existing user as manager: {}, isOnboarded={}", managerEmail, manager.isOnboarded());
        } else {
            // Create new pending manager user
            manager = new User();
            manager.setEmail(managerEmail);
            manager.setRole(Role.MANAGER);
            manager.setOnboarded(false);  // NEW managers must complete onboarding
            manager.setOrganization(organization);
            manager = userRepository.save(manager);
            isNewManager = true;
            logger.info("Created new pending manager user: {}, isOnboarded=false", managerEmail);
        }

        // Assign manager to team
        team.setManager(manager);
        manager.setTeam(team);
        manager.setOrganization(organization);
        
        teamRepository.save(team);
        userRepository.save(manager);

        logger.info("Manager {} assigned to team {}", managerEmail, teamId);

        // Send invitation email
        emailService.sendManagerInvitation(
            managerEmail,
            manager.getFirstName() != null ? manager.getFirstName() : "",
            team.getTeamName(),
            organization.getOrganisationName()
        );

        return Map.of(
            "success", true,
            "message", isNewManager ? "Manager invited successfully. Invitation email sent." : "Manager assigned successfully.",
            "manager_id", manager.getId().toString(),
            "manager_email", managerEmail,
            "team_id", teamId.toString(),
            "is_new_manager", isNewManager
        );
    }
}
