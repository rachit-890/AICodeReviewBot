package com.proj.prreviewbot.controller;


import com.proj.prreviewbot.dto.GitHubPRData;
import com.proj.prreviewbot.dto.ReviewRequest;
import com.proj.prreviewbot.dto.ReviewResponse;
import com.proj.prreviewbot.service.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {

    private final GitHubService gitHubService;
    private final LLMService    llmService;

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

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health-check")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Code Reviewer is running");
    }
}
