package com.agile.jaljira.controllers;

import com.agile.jaljira.models.SprintTemplate;
import com.agile.jaljira.services.SprintTemplateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprint-templates")
public class SprintTemplateController {

    private static final Logger logger = LoggerFactory.getLogger(SprintTemplateController.class);

    private final SprintTemplateService sprintTemplateService;

    public SprintTemplateController(SprintTemplateService sprintTemplateService) {
        this.sprintTemplateService = sprintTemplateService;
    }

    /**
     * Get all sprint templates
     */
    @GetMapping
    public ResponseEntity<List<SprintTemplate>> getAllSprintTemplates() {
        try {
            List<SprintTemplate> templates = sprintTemplateService.getAllSprintTemplates();
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            logger.error("Error fetching sprint templates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
