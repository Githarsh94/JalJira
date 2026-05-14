package com.agile.jaljira.repositories;

import com.agile.jaljira.models.Type;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TypeRepository extends JpaRepository<Type, UUID> {
}
