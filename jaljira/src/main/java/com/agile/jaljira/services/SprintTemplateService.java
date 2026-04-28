package com.agile.jaljira.services;

import com.agile.jaljira.models.SprintTemplate;
import com.agile.jaljira.repositories.SprintTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SprintTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(SprintTemplateService.class);

    private final SprintTemplateRepository sprintTemplateRepository;

    public SprintTemplateService(SprintTemplateRepository sprintTemplateRepository) {
        this.sprintTemplateRepository = sprintTemplateRepository;
    }

    /**
     * Get all sprint templates
     */
    public List<SprintTemplate> getAllSprintTemplates() {
        return sprintTemplateRepository.findAll();
    }

    /**
     * Get sprint template by id
     */
    public Optional<SprintTemplate> getSprintTemplateById(UUID id) {
        return sprintTemplateRepository.findById(id);
    }

    /**
     * Initialize default sprint templates (called on first startup)
     */
    public void initializeDefaultTemplates() {
        if (sprintTemplateRepository.count() == 0) {
            SprintTemplate twoWeek = new SprintTemplate(
                "Scrum (two-week sprints)",
                "Standard Scrum with two-week sprint cycles",
                14
            );
            
            SprintTemplate oneWeek = new SprintTemplate(
                "Scrum (one-week sprints)",
                "Agile development with one-week sprint cycles",
                7
            );
            
            sprintTemplateRepository.saveAll(List.of(twoWeek, oneWeek));
            logger.info("Default sprint templates initialized");
        }
    }
}
