package com.agile.jaljira.controllers;

import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
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
