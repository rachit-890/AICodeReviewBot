package com.proj.prreviewbot.repository;

import com.proj.prreviewbot.entity.Finding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingRepository extends JpaRepository<Finding, UUID> {
    List<Finding> findByReviewId(UUID reviewId);
}