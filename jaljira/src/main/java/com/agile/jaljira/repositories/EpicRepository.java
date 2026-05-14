package com.agile.jaljira.repositories;

import com.agile.jaljira.models.Epic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EpicRepository extends JpaRepository<Epic, UUID> {
    List<Epic> findByTeam_Id(UUID teamId);
    List<Epic> findBySprint_Id(UUID sprintId);
    List<Epic> findByOrganization_Id(UUID organizationId);
}
