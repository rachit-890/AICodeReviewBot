package com.proj.prreviewbot.controller;

import com.proj.prreviewbot.dto.GitHubPRData;
import com.proj.prreviewbot.dto.ReviewRequest;
import com.proj.prreviewbot.dto.ReviewResponse;
import com.proj.prreviewbot.entity.Review;
import com.proj.prreviewbot.service.GitHubService;
import com.proj.prreviewbot.service.LLMService;
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

    @PostMapping("/review")
    public ResponseEntity<ReviewResponse> review(
            @Valid @RequestBody ReviewRequest request) {

        log.info("Review requested for: {}", request.getPrUrl());

        // Step 1: Fetch PR data from GitHub
        GitHubPRData prData = gitHubService.fetchPRData(request.getPrUrl());
        log.info("Fetched PR: '{}' with {} files changed",
                prData.getTitle(), prData.getChangedFiles().size());

        // Step 2: Get LLM review
        ReviewResponse response = llmService.review(prData);
        log.info("Review complete. Score: {}, Findings: {}",
                response.getOverallScore(), response.getFindings().size());

        // Step 3: Save to database
        Review saved = persistenceService.saveReview(response, prData.getHeadCommitSha());
        log.info("Persisted review with id: {}", saved.getId());

        // Step 4: Add the saved ID to response
        response.setId(saved.getId());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/review/{id}")
    public ResponseEntity<Review> getReview(@PathVariable UUID id) {
        return ResponseEntity.ok(persistenceService.getReviewById(id));
    }

    @GetMapping("/review/history")
    public ResponseEntity<List<Review>> getHistory() {
        return ResponseEntity.ok(persistenceService.getAllReviews());
    }

    @GetMapping("/health-check")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Code Reviewer is running");
    }
}