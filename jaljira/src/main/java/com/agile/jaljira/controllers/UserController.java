package com.agile.jaljira.controllers;

import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.UserRepository;
import com.agile.jaljira.services.ManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final ManagerService managerService;

    public UserController(UserRepository userRepository, ManagerService managerService) {
        this.userRepository = userRepository;
        this.managerService = managerService;
    }

    @GetMapping("/api/user/info")
    public ResponseEntity<Map<String, Object>> userInfo(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                "lastName", user.getLastName() != null ? user.getLastName() : "",
                "role", user.getRole().name(),
                "isOnboarded", user.isOnboarded(),
                "organization_id", user.getOrganization() != null ? user.getOrganization().getId().toString() : ""
        ));
    }

    /**
     * Get root epics (parent_id = null, depth = 0) for the current user's organization.
     * Accessible to all authenticated users.
     */
    @GetMapping("/api/user/epics")
    public ResponseEntity<?> getOrganizationEpics(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (user.getOrganization() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "User is not linked to an organization"
                ));
            }

            List<Map<String, Object>> epics = managerService.getOrganizationEpicsForResponse(user.getOrganization().getId());
            logger.info("Retrieved {} epics for organization {} via user endpoint", epics.size(), user.getOrganization().getId());
            return ResponseEntity.ok(epics);
        } catch (Exception e) {
            logger.error("Error fetching epics for user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Failed to fetch epics"));
        }
    }

    /**
     * Get details of a specific epic for the current user's organization.
     */
    @GetMapping("/api/user/epics/{epicId}")
    public ResponseEntity<?> getEpicDetails(
            @PathVariable UUID epicId,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (user.getOrganization() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "User is not linked to an organization"
                ));
            }

            var epic = managerService.getEpicDetailsForResponse(user.getOrganization().getId(), epicId);
            if (epic.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "error", "Epic not found"));
            }

            return ResponseEntity.ok(epic.get());
        } catch (Exception e) {
            logger.error("Error fetching epic details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Failed to fetch epic details"));
        }
    }

    /**
     * Update title and description of a specific epic for the current user's organization.
     */
    @PutMapping("/api/user/epics/{epicId}")
    public ResponseEntity<?> updateEpicDetails(
            @PathVariable UUID epicId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (user.getOrganization() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "User is not linked to an organization"
                ));
            }

            String title = request.get("title");
            String description = request.get("description");
            Map<String, Object> result = managerService.updateEpicDetails(
                    user.getOrganization().getId(),
                    epicId,
                    title,
                    description
            );

            if (Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.ok(result);
            }

            return ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            logger.error("Error updating epic details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Failed to update epic"));
        }
    }

    /**
     * Fallback update endpoint for clients/environments where PUT may be blocked.
     */
    @PostMapping("/api/user/epics/{epicId}/update")
    public ResponseEntity<?> updateEpicDetailsPost(
            @PathVariable UUID epicId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        return updateEpicDetails(epicId, request, authentication);
    }

    /**
     * Mark current user as onboarded
     * Used when managers accept invitation from email
     */
    @PostMapping("/api/user/mark-onboarded")
    public ResponseEntity<Map<String, Object>> markOnboarded(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            user.setOnboarded(true);
            userRepository.save(user);
            logger.info("User marked as onboarded: {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User marked as onboarded",
                    "isOnboarded", true
            ));
        } catch (IllegalArgumentException e) {
            logger.warn("User not found during mark-onboarded");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "User not found"));
        } catch (Exception e) {
            logger.error("Error marking user as onboarded", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Unable to update onboarded status"));
        }
    }
}
