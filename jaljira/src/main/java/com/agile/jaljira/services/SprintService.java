package com.agile.jaljira.services;

import com.agile.jaljira.models.Organization;
import com.agile.jaljira.models.Sprint;
import com.agile.jaljira.models.SprintTemplate;
import com.agile.jaljira.repositories.OrganizationRepository;
import com.agile.jaljira.repositories.SprintRepository;
import com.agile.jaljira.repositories.SprintTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SprintService {

    private static final Logger logger = LoggerFactory.getLogger(SprintService.class);

    private final SprintRepository sprintRepository;
    private final SprintTemplateRepository sprintTemplateRepository;
    private final OrganizationRepository organizationRepository;

    public SprintService(SprintRepository sprintRepository,
                        SprintTemplateRepository sprintTemplateRepository,
                        OrganizationRepository organizationRepository) {
        this.sprintRepository = sprintRepository;
        this.sprintTemplateRepository = sprintTemplateRepository;
        this.organizationRepository = organizationRepository;
    }

    /**
     * Create a new sprint for an organization
     */
    @Transactional
    public Map<String, Object> createSprint(UUID organizationId, UUID sprintTemplateId, LocalDateTime startDate) {
        // Validate organization exists
        Optional<Organization> orgOpt = organizationRepository.findById(organizationId);
        if (orgOpt.isEmpty()) {
            logger.warn("Organization not found: {}", organizationId);
            return Map.of("success", false, "error", "Organization not found");
        }

        // Validate sprint template exists
        Optional<SprintTemplate> templateOpt = sprintTemplateRepository.findById(sprintTemplateId);
        if (templateOpt.isEmpty()) {
            logger.warn("Sprint template not found: {}", sprintTemplateId);
            return Map.of("success", false, "error", "Sprint template not found");
        }

        SprintTemplate template = templateOpt.get();

        // Calculate end date
        LocalDateTime endDate = startDate.plus(template.getDurationDays(), ChronoUnit.DAYS);

        // Create and save sprint
        Sprint sprint = new Sprint(orgOpt.get(), template, startDate, endDate);
        Sprint savedSprint = sprintRepository.save(sprint);

        logger.info("Sprint created: id={}, org_id={}, template_id={}, start={}, end={}", 
            savedSprint.getId(), organizationId, sprintTemplateId, startDate, endDate);

        return Map.of(
            "success", true,
            "message", "Sprint created successfully",
            "sprint_id", savedSprint.getId().toString(),
            "start_date", startDate.toString(),
            "end_date", endDate.toString()
        );
    }

    /**
     * Get all sprints for an organization
     */
    public List<Sprint> getSprintsByOrganization(UUID organizationId) {
        return sprintRepository.findByOrganizationId(organizationId);
    }

    /**
     * Get sprint by id
     */
    public Optional<Sprint> getSprintById(UUID sprintId) {
        return sprintRepository.findById(sprintId);
    }
}
