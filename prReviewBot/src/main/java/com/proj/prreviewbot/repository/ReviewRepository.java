package com.proj.prreviewbot.repository;

import com.proj.prreviewbot.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByPrUrlOrderByReviewedAtDesc(String prUrl);
    List<Review> findAllByOrderByReviewedAtDesc();
}