package com.agile.jaljira.repositories;

import com.agile.jaljira.models.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    
    // Find all tasks for a team
    List<Task> findByTeam_Id(UUID teamId);
    
    // Find all tasks for an organization
    List<Task> findByOrganization_Id(UUID organizationId);
    
    // Find direct children of a task (by parent_id)
    List<Task> findByParentId(UUID parentId);
    
    // Find specific task by path
    Optional<Task> findByPath(String path);
    
    // Find all descendants of a task (subtree query using materialized path)
    @Query("SELECT t FROM Task t WHERE t.path LIKE CONCAT(:pathPrefix, '.%') ORDER BY t.path")
    List<Task> findSubtreeByPathPrefix(@Param("pathPrefix") String pathPrefix);
    
    // Find all tasks of a specific type for a team
    List<Task> findByTeam_IdAndType_Id(UUID teamId, UUID typeId);
    
    // Find all tasks of a specific type for an organization
    List<Task> findByOrganization_IdAndType_Id(UUID organizationId, UUID typeId);

    // Find root EPIC tasks for a team (hierarchy roots: parent_id is null, depth = 0)
    List<Task> findByTeam_IdAndParentIdIsNullAndDepthAndType_Label(UUID teamId, Integer depth, String typeLabel);

    // Find root EPIC tasks for an organization (hierarchy roots: parent_id is null, depth = 0)
    List<Task> findByOrganization_IdAndParentIdIsNullAndDepthAndType_Label(UUID organizationId, Integer depth, String typeLabel);
    
    // Find all tasks with a specific status
    List<Task> findByStatus_Id(UUID statusId);
}
