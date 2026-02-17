package com.agile.jaljira.repositories;

import com.agile.jaljira.models.User;
import com.agile.jaljira.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByTeamId(UUID teamId);
}
