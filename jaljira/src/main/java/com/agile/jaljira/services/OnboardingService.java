package com.agile.jaljira.services;

import com.agile.jaljira.models.Organization;
import com.agile.jaljira.models.Plan;
import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.OrganizationRepository;
import com.agile.jaljira.repositories.PlanRepository;
import com.agile.jaljira.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.agile.jaljira.models.Role;

@Service
public class OnboardingService {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingService.class);

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PlanRepository planRepository;

    public OnboardingService(UserRepository userRepository, 
                            OrganizationRepository organizationRepository,
                            PlanRepository planRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.planRepository = planRepository;
    }

    /**
     * Get all available plans
     */
    public List<Plan> getAllPlans() {
        return planRepository.findAll();
    }

    /**
     * Submit onboarding form and create organization
     */
    @Transactional
    public Map<String, Object> submitOnboarding(UUID userId, Map<String, String> onboardingData) {
        // Validation
        String organizationName = onboardingData.get("organization_name");
        String planIdStr = onboardingData.get("plan_id");

        if (organizationName == null || organizationName.isBlank()) {
            return Map.of("success", false, "error", "Organization name is required");
        }

        if (planIdStr == null || planIdStr.isBlank()) {
            return Map.of("success", false, "error", "Plan selection is required");
        }

        // Validate and fetch plan
        UUID planId;
        try {
            planId = UUID.fromString(planIdStr);
        } catch (IllegalArgumentException e) {
            return Map.of("success", false, "error", "Invalid plan ID format");
        }

        Optional<Plan> plan = planRepository.findById(planId);
        if (plan.isEmpty()) {
            return Map.of("success", false, "error", "Selected plan not found");
        }

        // Validate user exists
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Map.of("success", false, "error", "User not found");
        }

        User user = userOpt.get();

        // Check if organization with same name already exists
        Optional<Organization> existingOrg = organizationRepository.findByOrganisationName(organizationName);
        Organization savedOrg;

        if (existingOrg.isPresent()) {
            // Use existing organization
            savedOrg = existingOrg.get();
            logger.info("Using existing organization: id={}, name={}", savedOrg.getId(), savedOrg.getOrganisationName());
        } else {
            // Create new organization
            Organization organization = new Organization(organizationName, plan.get());
            savedOrg = organizationRepository.save(organization);
            logger.info("Organization created: id={}, name={}", savedOrg.getId(), savedOrg.getOrganisationName());
        }

        // Enforce admin limit: only 2 admins allowed per organization
        long adminCount = userRepository.countByOrganization_IdAndRole(savedOrg.getId(), Role.ADMIN);
        if (adminCount >= 2) {
            logger.warn("Organization {} already has {} admins, denying onboarding for user {}", savedOrg.getId(), adminCount, userId);
            //delete this new user as we can't onboard them
            userRepository.delete(user);
            return Map.of("success", false, "error", "we already have 2 admins per org and we can't provide access to more");
        }

        // Update user with organization and onboarded flag
        user.setOrganization(savedOrg);
        user.setOnboarded(true);
        userRepository.save(user);

        logger.info("User onboarded: userId={}, orgId={}", userId, savedOrg.getId());

        return Map.of(
                "success", true,
                "message", "Onboarding completed successfully",
                "organization_id", savedOrg.getId().toString(),
                "user_id", userId.toString()
        );
    }
}
