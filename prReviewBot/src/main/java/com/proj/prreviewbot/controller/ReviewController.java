package com.proj.prreviewbot.controller;

import com.proj.prreviewbot.dto.GitHubPRData;
import com.proj.prreviewbot.dto.ReviewDetailResponse;
import com.proj.prreviewbot.dto.ReviewRequest;
import com.proj.prreviewbot.dto.ReviewResponse;
import com.proj.prreviewbot.entity.Review;
import com.proj.prreviewbot.service.GitHubService;
import com.proj.prreviewbot.service.LLMService;
import com.proj.prreviewbot.service.ReviewCacheService;
import com.proj.prreviewbot.service.ReviewPersistenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {

    private final GitHubService gitHubService;
    private final LLMService llmService;
    private final ReviewPersistenceService persistenceService;
    private final ReviewCacheService cacheService;

    @PostMapping("/review")
    public ResponseEntity<ReviewResponse> review(
            @Valid @RequestBody ReviewRequest request) {

        log.info("Review requested for: {}", request.getPrUrl());

        // Step 1: Fetch PR data from GitHub
        GitHubPRData prData = gitHubService.fetchPRData(request.getPrUrl());
        log.info("Fetched PR: '{}' with {} files changed",
                prData.getTitle(), prData.getChangedFiles().size());

        // Step 2: Check cache first
        ReviewResponse cached = cacheService.getCachedReview(
                request.getPrUrl(), prData.getHeadCommitSha());
        if (cached != null) {
            log.info("Returning cached review for PR: {}", request.getPrUrl());
            return ResponseEntity.ok(cached);
        }

        // Step 3: Get LLM review
        ReviewResponse response = llmService.review(prData);
        log.info("Review complete. Score: {}, Findings: {}",
                response.getOverallScore(), response.getFindings().size());

        // Step 4: Save to database
        Review saved = persistenceService.saveReview(response, prData.getHeadCommitSha());
        response.setId(saved.getId());

        // Step 5: Cache the result
        cacheService.cacheReview(request.getPrUrl(), prData.getHeadCommitSha(), response);

        // Step 6: Post review summary as a comment/review back to GitHub PR
        try {
            gitHubService.postReview(request.getPrUrl(), response);
        } catch (Exception e) {
            log.warn("Failed to post review back to GitHub: {}", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/review/{id}")
    public ResponseEntity<ReviewDetailResponse> getReview(@PathVariable UUID id) {
        return ResponseEntity.ok(persistenceService.getReviewById(id));
    }
    @GetMapping("/review/history")
    public ResponseEntity<List<ReviewDetailResponse>> getHistory() {
        return ResponseEntity.ok(persistenceService.getAllReviews());
    }

    @GetMapping("/health-check")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Code Reviewer is running");
    }
}