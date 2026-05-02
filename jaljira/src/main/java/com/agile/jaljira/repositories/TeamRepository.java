package com.agile.jaljira.repositories;

import com.agile.jaljira.models.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByOrganization_Id(UUID organizationId);
    Optional<Team> findByManager_Id(UUID managerId);
}
