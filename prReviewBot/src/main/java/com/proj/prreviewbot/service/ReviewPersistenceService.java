package com.proj.prreviewbot.service;

import com.proj.prreviewbot.dto.ReviewDetailResponse;
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
        Review review = Review.builder()
                .prUrl(response.getPrUrl())
                .prTitle(response.getPrTitle())
                .repository(response.getRepository())
                .summary(response.getSummary())
                .overallScore(response.getOverallScore())
                .reviewedAt(response.getReviewedAt())
                .headCommitSha(headCommitSha)
                .build();

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

        Review saved = reviewRepository.save(review);
        log.info("Saved review {} with {} findings", saved.getId(), findings.size());
        return saved;
    }

    @Transactional(readOnly = true)
    public ReviewDetailResponse getReviewById(UUID id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Review not found with id: " + id));
        return toDetailResponse(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewDetailResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByReviewedAtDesc()
                .stream()
                .map(this::toDetailResponse)
                .collect(Collectors.toList());
    }

    // Convert entity to DTO while session is still open
    private ReviewDetailResponse toDetailResponse(Review review) {
        List<ReviewDetailResponse.FindingDetail> findings = review.getFindings()
                .stream()
                .map(f -> ReviewDetailResponse.FindingDetail.builder()
                        .id(f.getId())
                        .severity(f.getSeverity())
                        .category(f.getCategory())
                        .file(f.getFilePath())
                        .line(f.getLineNumber())
                        .title(f.getTitle())
                        .description(f.getDescription())
                        .suggestion(f.getSuggestion())
                        .build())
                .collect(Collectors.toList());

        return ReviewDetailResponse.builder()
                .id(review.getId())
                .prUrl(review.getPrUrl())
                .prTitle(review.getPrTitle())
                .repository(review.getRepository())
                .summary(review.getSummary())
                .overallScore(review.getOverallScore())
                .headCommitSha(review.getHeadCommitSha())
                .reviewedAt(review.getReviewedAt())
                .findings(findings)
                .build();
    }
}