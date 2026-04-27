package com.agile.jaljira.controllers;

import com.agile.jaljira.models.Plan;
import com.agile.jaljira.services.OnboardingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingController.class);

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    /**
     * Get all available plans
     */
    @GetMapping("/plans")
    public ResponseEntity<List<Plan>> getPlans() {
        try {
            List<Plan> plans = onboardingService.getAllPlans();
            return ResponseEntity.ok(plans);
        } catch (Exception e) {
            logger.error("Error fetching plans", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Submit onboarding form
     * Request body should contain:
     * {
     *   "user_id": "uuid",
     *   "organization_name": "string",
     *   "plan_id": "uuid"
     * }
     */
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitOnboarding(@RequestBody Map<String, String> request) {
        try {
            String userIdStr = request.get("user_id");
            if (userIdStr == null || userIdStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "User ID is required"));
            }

            UUID userId;
            try {
                userId = UUID.fromString(userIdStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Invalid user ID format"));
            }

            Map<String, Object> result = onboardingService.submitOnboarding(userId, request);

            if ((boolean) result.get("success")) {
                logger.info("Onboarding submitted successfully for user: {}", userId);
                return ResponseEntity.ok(result);
            } else {
                logger.warn("Onboarding validation failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }

        } catch (Exception e) {
            logger.error("Error submitting onboarding", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
        }
    }
}
