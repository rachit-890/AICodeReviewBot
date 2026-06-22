package com.proj.prreviewbot.service;

import com.proj.prreviewbot.dto.ReviewResponse;
import com.proj.prreviewbot.entity.Finding;
import com.proj.prreviewbot.entity.Review;
import com.proj.prreviewbot.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewPersistenceService {

    private final ReviewRepository reviewRepository;

    @Transactional
    public Review saveReview(ReviewResponse response, String headCommitSha) {
        // 1. Build Review entity
        Review review = Review.builder()
                .prUrl(response.getPrUrl())
                .prTitle(response.getPrTitle())
                .repository(response.getRepository())
                .summary(response.getSummary())
                .overallScore(response.getOverallScore())
                .reviewedAt(response.getReviewedAt())
                .headCommitSha(headCommitSha)
                .build();

        // 2. Build Finding entities
        List<Finding> findings = response.getFindings().stream()
                .map(f -> Finding.builder()
                        .review(review)
                        .severity(f.getSeverity())
                        .category(f.getCategory())
                        .filePath(f.getFile())
                        .lineNumber(f.getLine())
                        .title(f.getTitle())
                        .description(f.getDescription())
                        .suggestion(f.getSuggestion())
                        .build())
                .collect(Collectors.toList());

        review.getFindings().addAll(findings);

        // 3. Save (cascades to findings automatically)
        Review saved = reviewRepository.save(review);
        log.info("Saved review {} with {} findings", saved.getId(), findings.size());
        return saved;
    }

    public Review getReviewById(UUID id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Review not found with id: " + id));
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAllByOrderByReviewedAtDesc();
    }
}