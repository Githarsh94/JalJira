package com.agile.jaljira.repositories;

import com.agile.jaljira.models.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskStatusRepository extends JpaRepository<TaskStatus, UUID> {
    List<TaskStatus> findByTeam_Id(UUID teamId);
    List<TaskStatus> findByOrganization_Id(UUID organizationId);
}
