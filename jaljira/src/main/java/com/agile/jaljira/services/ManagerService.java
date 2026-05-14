package com.agile.jaljira.services;

import com.agile.jaljira.models.*;
import com.agile.jaljira.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ManagerService {
    
    private static final Logger logger = LoggerFactory.getLogger(ManagerService.class);
    
    private final TaskStatusRepository taskStatusRepository;
    private final EpicRepository epicRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final SprintRepository sprintRepository;
    private final TypeRepository typeRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    
    public ManagerService(TaskStatusRepository taskStatusRepository,
                         EpicRepository epicRepository,
                         TaskRepository taskRepository,
                         TeamRepository teamRepository,
                         SprintRepository sprintRepository,
                         TypeRepository typeRepository,
                         UserRepository userRepository,
                         OrganizationRepository organizationRepository) {
        this.taskStatusRepository = taskStatusRepository;
        this.epicRepository = epicRepository;
        this.taskRepository = taskRepository;
        this.teamRepository = teamRepository;
        this.sprintRepository = sprintRepository;
        this.typeRepository = typeRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }
    
    /**
     * Create a new task status for a team
     * Only managers of the team can create task statuses
     */
    @Transactional
    public Map<String, Object> createTaskStatus(UUID teamId, String statusType, String description, User manager) {
        logger.info("Manager {} attempting to create task status for team {}", manager.getEmail(), teamId);
        
        // Verify team exists
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        if (teamOpt.isEmpty()) {
            logger.warn("Team not found: {}", teamId);
            return Map.of("success", false, "error", "Team not found");
        }
        
        Team team = teamOpt.get();
        
        // Verify manager is the team manager
        if (!team.getManager().getId().equals(manager.getId())) {
            logger.warn("User {} is not manager of team {}", manager.getEmail(), teamId);
            return Map.of("success", false, "error", "Only team manager can create task statuses");
        }
        
        try {
            TaskStatus taskStatus = new TaskStatus(statusType, description, team, team.getOrganization());
            TaskStatus saved = taskStatusRepository.save(taskStatus);
            
            logger.info("Task status created successfully: {} for team {}", statusType, teamId);
            return Map.of(
                "success", true,
                "message", "Task status created successfully",
                "taskStatusId", saved.getId().toString()
            );
        } catch (Exception e) {
            logger.error("Error creating task status", e);
            return Map.of("success", false, "error", "Failed to create task status: " + e.getMessage());
        }
    }
    
    /**
     * Create a new epic for a team
     * Only managers can create epics
     * Creates a root Task node with type=EPIC
     * Type is auto-assigned as EPIC, no need to pass typeId
     */
    @Transactional
    public Map<String, Object> createEpic(UUID teamId, String title, String description, UUID sprintId, User manager) {
        logger.info("Manager {} attempting to create epic for team {}", manager.getEmail(), teamId);
        
        // Verify team exists
        Optional<Team> teamOpt = teamRepository.findById(teamId);
        if (teamOpt.isEmpty()) {
            logger.warn("Team not found: {}", teamId);
            return Map.of("success", false, "error", "Team not found");
        }
        
        Team team = teamOpt.get();
        
        // Verify manager is the team manager
        if (!team.getManager().getId().equals(manager.getId())) {
            logger.warn("User {} is not manager of team {}", manager.getEmail(), teamId);
            return Map.of("success", false, "error", "Only team manager can create epics");
        }
        
        // Auto-select sprint if not provided
        Sprint sprint;
        if (sprintId == null) {
            logger.info("Sprint ID not provided, auto-selecting first sprint for organization {}", team.getOrganization().getId());
            // Get first sprint for the organization
            List<Sprint> sprints = sprintRepository.findAll().stream()
                    .filter(s -> s.getOrganization().getId().equals(team.getOrganization().getId()))
                    .toList();
            
            if (sprints.isEmpty()) {
                logger.warn("No sprints found for organization {}", team.getOrganization().getId());
                return Map.of("success", false, "error", "No sprints available for this organization. Please create a sprint first.");
            }
            sprint = sprints.get(0);
            logger.info("Auto-selected sprint: {}", sprint.getId());
        } else {
            // Verify sprint exists and belongs to the same organization
            Optional<Sprint> sprintOpt = sprintRepository.findById(sprintId);
            if (sprintOpt.isEmpty()) {
                logger.warn("Sprint not found: {}", sprintId);
                return Map.of("success", false, "error", "Sprint not found");
            }
            
            sprint = sprintOpt.get();
            if (!sprint.getOrganization().getId().equals(team.getOrganization().getId())) {
                logger.warn("Sprint does not belong to team's organization");
                return Map.of("success", false, "error", "Sprint does not belong to this organization");
            }
        }
        
        // Get EPIC type
        Type epicType = typeRepository.findAll().stream()
                .filter(t -> "EPIC".equals(t.getLabel()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("EPIC type not found"));
        
        // Get default status (first status for the team)
        TaskStatus status = taskStatusRepository.findByTeam_Id(teamId).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No task status found for team"));
        
        try {
            // Create Task with type=EPIC as root node (path = UUID, depth = 0, parent_id = null)
            Task epicTask = new Task();
            epicTask.setPath(UUID.randomUUID().toString()); // Root node has UUID as path
            epicTask.setDepth(0);
            epicTask.setParentId(null);
            epicTask.setType(epicType);
            epicTask.setTitle(title);
            epicTask.setDescription(description);
            epicTask.setTeam(team);
            epicTask.setOrganization(team.getOrganization());
            epicTask.setStatus(status);
            epicTask.setSprint(sprint);
            epicTask.setUser(manager);
            
            Task saved = taskRepository.save(epicTask);
            
            logger.info("Epic created successfully as Task: {} for team {}", title, teamId);
            // Also create corresponding Epic entity so epics can be queried via EpicRepository
            Epic epic = new Epic(title, description, epicType, sprint, manager, team, team.getOrganization());
            Epic savedEpic = epicRepository.save(epic);

            return Map.of(
                "success", true,
                "message", "Epic created successfully",
                "taskId", saved.getId().toString(),
                "epicId", savedEpic.getId().toString()
            );
        } catch (Exception e) {
            logger.error("Error creating epic", e);
            return Map.of("success", false, "error", "Failed to create epic: " + e.getMessage());
        }
    }
    
    /**
     * Get all task statuses for a team
     */
    public List<TaskStatus> getTeamTaskStatuses(UUID teamId) {
        return taskStatusRepository.findByTeam_Id(teamId);
    }
    
    /**
     * Get all epics for a team
     */
    public List<Epic> getTeamEpics(UUID teamId) {
        return epicRepository.findByTeam_Id(teamId);
    }
    
    /**
     * Get all epics for an organization
     */
    public List<Epic> getOrganizationEpics(UUID organizationId) {
        return epicRepository.findByOrganization_Id(organizationId);
    }
    
    /**
     * Get all epics for an organization in response format
     */
    public List<Map<String, Object>> getOrganizationEpicsForResponse(UUID organizationId) {
        List<Task> epics = taskRepository.findByOrganization_IdAndParentIdIsNullAndDepthAndType_Label(
            organizationId,
            0,
            "EPIC"
        );

        return epics.stream()
            .map(epicTask -> {
                    Map<String, Object> epicMap = new java.util.LinkedHashMap<>();
                epicMap.put("id", epicTask.getId().toString());
                epicMap.put("title", epicTask.getTitle());
                epicMap.put("description", epicTask.getDescription());
                epicMap.put("teamId", epicTask.getTeam() != null ? epicTask.getTeam().getId().toString() : null);
                epicMap.put("teamName", epicTask.getTeam() != null ? epicTask.getTeam().getTeamName() : null);
                epicMap.put("sprintId", epicTask.getSprint() != null ? epicTask.getSprint().getId().toString() : null);
                epicMap.put("assignedTo", epicTask.getUser() != null ? Map.of(
                    "id", epicTask.getUser().getId().toString(),
                    "email", epicTask.getUser().getEmail(),
                    "firstName", epicTask.getUser().getFirstName() != null ? epicTask.getUser().getFirstName() : "",
                    "lastName", epicTask.getUser().getLastName() != null ? epicTask.getUser().getLastName() : ""
                ) : null);
                epicMap.put("createdAt", epicTask.getCreatedAt() != null ? epicTask.getCreatedAt().toString() : null);
                    return epicMap;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get details of a specific epic (root EPIC task) for an organization.
     */
    public Optional<Map<String, Object>> getEpicDetailsForResponse(UUID organizationId, UUID epicId) {
        Optional<Task> epicOpt = taskRepository.findById(epicId);
        if (epicOpt.isEmpty()) {
            return Optional.empty();
        }

        Task epicTask = epicOpt.get();

        boolean isEpicRoot = epicTask.getType() != null
                && "EPIC".equals(epicTask.getType().getLabel())
                && epicTask.getParentId() == null
                && Integer.valueOf(0).equals(epicTask.getDepth());

        boolean sameOrganization = epicTask.getOrganization() != null
                && organizationId.equals(epicTask.getOrganization().getId());

        if (!isEpicRoot || !sameOrganization) {
            return Optional.empty();
        }

        Map<String, Object> epicMap = new LinkedHashMap<>();
        epicMap.put("id", epicTask.getId().toString());
        epicMap.put("title", epicTask.getTitle());
        epicMap.put("description", epicTask.getDescription());
        epicMap.put("teamId", epicTask.getTeam() != null ? epicTask.getTeam().getId().toString() : null);
        epicMap.put("teamName", epicTask.getTeam() != null ? epicTask.getTeam().getTeamName() : null);
        epicMap.put("sprintId", epicTask.getSprint() != null ? epicTask.getSprint().getId().toString() : null);
        epicMap.put("assignedTo", epicTask.getUser() != null ? Map.of(
                "id", epicTask.getUser().getId().toString(),
                "email", epicTask.getUser().getEmail(),
                "firstName", epicTask.getUser().getFirstName() != null ? epicTask.getUser().getFirstName() : "",
                "lastName", epicTask.getUser().getLastName() != null ? epicTask.getUser().getLastName() : ""
        ) : null);
        epicMap.put("createdAt", epicTask.getCreatedAt() != null ? epicTask.getCreatedAt().toString() : null);
        epicMap.put("updatedAt", epicTask.getUpdatedAt() != null ? epicTask.getUpdatedAt().toString() : null);

        return Optional.of(epicMap);
    }

    /**
     * Update title/description of a specific epic (root EPIC task) for an organization.
     */
    @Transactional
    public Map<String, Object> updateEpicDetails(UUID organizationId, UUID epicId, String title, String description) {
        Optional<Task> epicOpt = taskRepository.findById(epicId);
        if (epicOpt.isEmpty()) {
            return Map.of("success", false, "error", "Epic not found");
        }

        Task epicTask = epicOpt.get();

        boolean isEpicRoot = epicTask.getType() != null
                && "EPIC".equals(epicTask.getType().getLabel())
                && epicTask.getParentId() == null
                && Integer.valueOf(0).equals(epicTask.getDepth());

        boolean sameOrganization = epicTask.getOrganization() != null
                && organizationId.equals(epicTask.getOrganization().getId());

        if (!isEpicRoot || !sameOrganization) {
            return Map.of("success", false, "error", "Epic not found");
        }

        if (title == null || title.trim().isEmpty()) {
            return Map.of("success", false, "error", "Epic title is required");
        }

        epicTask.setTitle(title.trim());
        epicTask.setDescription(description != null ? description.trim() : null);
        Task saved = taskRepository.save(epicTask);

        return Map.of(
                "success", true,
                "message", "Epic updated successfully",
                "epicId", saved.getId().toString()
        );
    }
    
    /**
     * Create a new story under an epic
     * Path: parent.path + "." + newUUID
     * Depth: parent.depth + 1
     * Type: STORY
     */
    @Transactional
    public Map<String, Object> createStory(UUID parentEpicId, String title, String description, User manager) {
        logger.info("Manager {} attempting to create story under epic {}", manager.getEmail(), parentEpicId);
        
        // Get parent epic (root task with type=EPIC)
        Optional<Task> parentOpt = taskRepository.findById(parentEpicId);
        if (parentOpt.isEmpty()) {
            logger.warn("Parent epic not found: {}", parentEpicId);
            return Map.of("success", false, "error", "Parent epic not found");
        }
        
        Task parent = parentOpt.get();
        
        // Verify parent is EPIC type
        if (!parent.getType().getLabel().equals("EPIC")) {
            logger.warn("Parent is not an EPIC: {} has type {}", parentEpicId, parent.getType().getLabel());
            return Map.of("success", false, "error", "Parent must be an EPIC");
        }
        
        // Verify manager is team manager
        if (!parent.getTeam().getManager().getId().equals(manager.getId())) {
            logger.warn("User {} is not manager of team {}", manager.getEmail(), parent.getTeam().getId());
            return Map.of("success", false, "error", "Only team manager can create stories");
        }
        
        try {
            // Get STORY type
            Type storyType = typeRepository.findAll().stream()
                    .filter(t -> "STORY".equals(t.getLabel()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("STORY type not found"));
            
            // Generate path: parent.path + "." + newUUID
            String newPath = parent.getPath() + "." + UUID.randomUUID().toString();
            
            // Create story task
            Task story = new Task();
            story.setPath(newPath);
            story.setDepth(parent.getDepth() + 1);
            story.setParentId(parent.getId());
            story.setType(storyType);
            story.setTitle(title);
            story.setDescription(description);
            story.setTeam(parent.getTeam());
            story.setOrganization(parent.getOrganization());
            story.setStatus(parent.getStatus()); // Inherit status from parent
            story.setSprint(parent.getSprint());
            story.setUser(manager);
            
            Task saved = taskRepository.save(story);
            
            logger.info("Story created successfully: {} under epic {}", title, parentEpicId);
            return Map.of(
                "success", true,
                "message", "Story created successfully",
                "taskId", saved.getId().toString()
            );
        } catch (Exception e) {
            logger.error("Error creating story", e);
            return Map.of("success", false, "error", "Failed to create story: " + e.getMessage());
        }
    }
    
    /**
     * Create a new task under a story or task
     * Path: parent.path + "." + newUUID
     * Depth: parent.depth + 1
     * Type: TASK or SUBTASK based on depth
     */
    @Transactional
    public Map<String, Object> createTask(UUID parentId, String title, String description, User manager) {
        logger.info("Manager {} attempting to create task under parent {}", manager.getEmail(), parentId);
        
        // Get parent task
        Optional<Task> parentOpt = taskRepository.findById(parentId);
        if (parentOpt.isEmpty()) {
            logger.warn("Parent task not found: {}", parentId);
            return Map.of("success", false, "error", "Parent task not found");
        }
        
        Task parent = parentOpt.get();
        
        // Verify parent is STORY or TASK type
        String parentType = parent.getType().getLabel();
        if (!("STORY".equals(parentType) || "TASK".equals(parentType) || "SUBTASK".equals(parentType))) {
            logger.warn("Parent cannot have children: {} has type {}", parentId, parentType);
            return Map.of("success", false, "error", "Parent type cannot have children");
        }
        
        // Verify manager is team manager
        if (!parent.getTeam().getManager().getId().equals(manager.getId())) {
            logger.warn("User {} is not manager of team {}", manager.getEmail(), parent.getTeam().getId());
            return Map.of("success", false, "error", "Only team manager can create tasks");
        }
        
        try {
            // Determine task type: TASK if parent is STORY, SUBTASK if depth >= 2
            Type taskType;
            if ("STORY".equals(parentType)) {
                taskType = typeRepository.findAll().stream()
                        .filter(t -> "TASK".equals(t.getLabel()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("TASK type not found"));
            } else {
                // Parent is TASK or SUBTASK, so create SUBTASK
                taskType = typeRepository.findAll().stream()
                        .filter(t -> "SUBTASK".equals(t.getLabel()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("SUBTASK type not found"));
            }
            
            // Generate path: parent.path + "." + newUUID
            String newPath = parent.getPath() + "." + UUID.randomUUID().toString();
            
            // Create task
            Task task = new Task();
            task.setPath(newPath);
            task.setDepth(parent.getDepth() + 1);
            task.setParentId(parent.getId());
            task.setType(taskType);
            task.setTitle(title);
            task.setDescription(description);
            task.setTeam(parent.getTeam());
            task.setOrganization(parent.getOrganization());
            task.setStatus(parent.getStatus()); // Inherit status from parent
            task.setSprint(parent.getSprint());
            task.setUser(manager);
            
            Task saved = taskRepository.save(task);
            
            logger.info("Task created successfully: {} under parent {}", title, parentId);
            return Map.of(
                "success", true,
                "message", "Task created successfully",
                "taskId", saved.getId().toString()
            );
        } catch (Exception e) {
            logger.error("Error creating task", e);
            return Map.of("success", false, "error", "Failed to create task: " + e.getMessage());
        }
    }
    
    /**
     * Create a subtask (generic method for creating child tasks)
     * This is equivalent to createTask but more explicit
     */
    @Transactional
    public Map<String, Object> createSubtask(UUID parentId, String title, String description, User manager) {
        return createTask(parentId, title, description, manager);
    }
    
    /**
     * Get all descendants of a task (subtree)
     * Uses materialized path to fetch all nodes where path LIKE 'parent_path.%'
     */
    public List<Task> getTaskSubtree(UUID taskId) {
        logger.info("Fetching subtree for task: {}", taskId);
        
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            logger.warn("Task not found: {}", taskId);
            return List.of();
        }
        
        Task task = taskOpt.get();
        String pathPrefix = task.getPath();
        
        // Find all descendants using path prefix
        List<Task> subtree = taskRepository.findSubtreeByPathPrefix(pathPrefix);
        logger.info("Found {} descendants for task {}", subtree.size(), taskId);
        return subtree;
    }
    
    /**
     * Move a task to a new parent
     * Updates path and depth for the task and all descendants
     */
    @Transactional
    public Map<String, Object> moveTask(UUID taskId, UUID newParentId, User manager) {
        logger.info("Manager {} attempting to move task {} to new parent {}", manager.getEmail(), taskId, newParentId);
        
        // Get task to move
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            logger.warn("Task not found: {}", taskId);
            return Map.of("success", false, "error", "Task not found");
        }
        
        Task task = taskOpt.get();
        
        // Get new parent
        Optional<Task> newParentOpt = taskRepository.findById(newParentId);
        if (newParentOpt.isEmpty()) {
            logger.warn("New parent not found: {}", newParentId);
            return Map.of("success", false, "error", "New parent not found");
        }
        
        Task newParent = newParentOpt.get();
        
        // Verify manager is team manager
        if (!task.getTeam().getManager().getId().equals(manager.getId())) {
            logger.warn("User {} is not manager of team {}", manager.getEmail(), task.getTeam().getId());
            return Map.of("success", false, "error", "Only team manager can move tasks");
        }
        
        // Verify new parent is in the same team
        if (!newParent.getTeam().getId().equals(task.getTeam().getId())) {
            logger.warn("New parent belongs to different team");
            return Map.of("success", false, "error", "New parent must be in the same team");
        }
        
        // Verify new parent is not a descendant of task (prevent cycles)
        if (newParent.getPath().startsWith(task.getPath())) {
            logger.warn("Cannot move task to its own descendant");
            return Map.of("success", false, "error", "Cannot move task to its own descendant");
        }
        
        try {
            // Calculate new path: newParent.path + "." + taskUUID
            String oldPath = task.getPath();
            String newPath = newParent.getPath() + "." + task.getId().toString();
            int oldDepth = task.getDepth();
            int newDepth = newParent.getDepth() + 1;
            int depthDifference = newDepth - oldDepth;
            
            // Update task
            task.setParentId(newParentId);
            task.setPath(newPath);
            task.setDepth(newDepth);
            taskRepository.save(task);
            
            // Update all descendants: recalculate path and depth
            List<Task> descendants = taskRepository.findSubtreeByPathPrefix(oldPath);
            for (Task descendant : descendants) {
                if (!descendant.getId().equals(taskId)) { // Skip the moved task itself
                    // Replace old path prefix with new path
                    String oldDescendantPath = descendant.getPath();
                    String newDescendantPath = newPath + oldDescendantPath.substring(oldPath.length());
                    descendant.setPath(newDescendantPath);
                    descendant.setDepth(descendant.getDepth() + depthDifference);
                    taskRepository.save(descendant);
                }
            }
            
            logger.info("Task moved successfully: {} from {} to {}", taskId, oldPath, newPath);
            return Map.of(
                "success", true,
                "message", "Task moved successfully"
            );
        } catch (Exception e) {
            logger.error("Error moving task", e);
            return Map.of("success", false, "error", "Failed to move task: " + e.getMessage());
        }
    }
}
