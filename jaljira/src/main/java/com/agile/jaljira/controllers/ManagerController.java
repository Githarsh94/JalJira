package com.agile.jaljira.controllers;

import com.agile.jaljira.dtos.CreateTaskStatusRequestDTO;
import com.agile.jaljira.dtos.CreateEpicRequestDTO;
import com.agile.jaljira.models.Role;
import com.agile.jaljira.models.User;
import com.agile.jaljira.repositories.UserRepository;
import com.agile.jaljira.services.ManagerService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    
    private static final Logger logger = LoggerFactory.getLogger(ManagerController.class);
    
    private final ManagerService managerService;
    private final UserRepository userRepository;
    
    public ManagerController(ManagerService managerService, UserRepository userRepository) {
        this.managerService = managerService;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new task status for a team
     * POST /api/manager/teams/{teamId}/task-status
     * Only team managers can create task statuses
     */
    @PostMapping("/teams/{teamId}/task-status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> createTaskStatus(
            @PathVariable UUID teamId,
            @Valid @RequestBody CreateTaskStatusRequestDTO request,
            Authentication auth) {
        try {
            User manager = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            if (manager.getRole() != Role.MANAGER && manager.getRole() != Role.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "error", "Only managers can create task statuses"));
            }
            
            Map<String, Object> result = managerService.createTaskStatus(
                    teamId,
                    request.getStatusType(),
                    request.getDescription(),
                    manager
            );
            
            if ((boolean) result.get("success")) {
                logger.info("Task status created successfully by {}", auth.getName());
                return ResponseEntity.ok(result);
            } else {
                logger.warn("Task status creation failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            logger.error("Error creating task status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Create a new epic for a team
     * POST /api/manager/teams/{teamId}/epics
     * Only team managers can create epics
     */
    @PostMapping("/teams/{teamId}/epics")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> createEpic(
            @PathVariable UUID teamId,
            @Valid @RequestBody CreateEpicRequestDTO request,
            Authentication auth) {
        try {
            User manager = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            if (manager.getRole() != Role.MANAGER && manager.getRole() != Role.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "error", "Only managers can create epics"));
            }
            
            Map<String, Object> result = managerService.createEpic(
                    teamId,
                    request.getTitle(),
                    request.getDescription(),
                    request.getSprintId(),
                    manager
            );
            
            if ((boolean) result.get("success")) {
                logger.info("Epic created successfully by {}", auth.getName());
                return ResponseEntity.ok(result);
            } else {
                logger.warn("Epic creation failed: {}", result.get("error"));
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            logger.error("Error creating epic", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Get all epics for the organization
     * GET /api/manager/epics
     */
    @GetMapping("/epics")
    public ResponseEntity<?> getOrganizationEpics(Authentication auth) {
        try {
            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            UUID organizationId = user.getOrganization().getId();
            var epics = managerService.getOrganizationEpicsForResponse(organizationId);
            
            logger.info("Retrieved {} epics for organization {}", epics.size(), organizationId);
            return ResponseEntity.ok(epics);
        } catch (Exception e) {
            logger.error("Error fetching epics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Failed to fetch epics"));
        }
    }
}
