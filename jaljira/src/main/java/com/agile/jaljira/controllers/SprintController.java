package com.agile.jaljira.controllers;

import com.agile.jaljira.services.SprintService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sprints")
public class SprintController {

    private static final Logger logger = LoggerFactory.getLogger(SprintController.class);

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    /**
     * Create a new sprint
     * Request body should contain:
     * {
     *   "org_id": "uuid",
     *   "sprint_template_id": "uuid",
     *   "start_date": "ISO 8601 timestamp"
     * }
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSprint(@RequestBody Map<String, String> request) {
        try {
            String orgIdStr = request.get("org_id");
            String sprintTemplateIdStr = request.get("sprint_template_id");
            String startDateStr = request.get("start_date");

            // Validate required fields
            if (orgIdStr == null || orgIdStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Organization ID is required"));
            }

            if (sprintTemplateIdStr == null || sprintTemplateIdStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Sprint template ID is required"));
            }

            if (startDateStr == null || startDateStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Start date is required"));
            }

            // Parse UUIDs
            UUID organizationId;
            UUID sprintTemplateId;
            try {
                organizationId = UUID.fromString(orgIdStr);
                sprintTemplateId = UUID.fromString(sprintTemplateIdStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Invalid UUID format"));
            }

            // Parse start date
            LocalDateTime startDate;
            try {
                startDate = LocalDateTime.parse(startDateStr);
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Invalid date format (use ISO 8601)"));
            }

            // Create sprint
            Map<String, Object> result = sprintService.createSprint(organizationId, sprintTemplateId, startDate);

            if ((boolean) result.get("success")) {
                logger.info("Sprint created successfully: org_id={}, template_id={}", organizationId, sprintTemplateId);
                return ResponseEntity.ok(result);
            } else {
                logger.warn("Sprint creation failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }

        } catch (Exception e) {
            logger.error("Error creating sprint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
        }
    }
}
