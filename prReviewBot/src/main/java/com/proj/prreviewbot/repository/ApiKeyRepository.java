package com.proj.prreviewbot.repository;

import com.proj.prreviewbot.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    Optional<ApiKey> findByKeyHashAndActiveTrue(String keyHash);

    @Modifying
    @Query("UPDATE ApiKey k SET k.active = false WHERE k.id = :id")
    void deactivateById(UUID id);

    @Modifying
    @Query("UPDATE ApiKey k SET k.lastUsedAt = :time WHERE k.id = :id")
    void updateLastUsed(UUID id, LocalDateTime time);
}