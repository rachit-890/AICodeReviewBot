package com.proj.prreviewbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for requesting repository vector indexing.
 * 
 * DESIGN DECISION & API INCONSISTENCY NOTE:
 * Unlike other endpoints (e.g. POST /review) which accept a remote GitHub 'prUrl',
 * 'repoPath' takes a local filesystem path to a checked-out repository (e.g., './prReviewBot' or '/home/fedora/codeReviewBot').
 * This local checkout path is explicitly required because the indexing engine needs direct filesystem access 
 * to parse and chunk source files locally before embedding.
 * 
 * UNIFIED ENDPOINT CONTRACT (Correction 5):
 * Optional 'sync' boolean field controls execution mode:
 * - sync=false (default): Triggers asynchronous background indexing, returning 202 ACCEPTED immediately.
 * - sync=true: Runs synchronous inline indexing, blocking until complete and returning 200 OK with indexed chunk count.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndexRequest {

    @NotBlank(message = "Repository name is required")
    private String repository;

    /**
     * Local filesystem path to the checked-out repository (e.g., "./prReviewBot" or "/path/to/repo").
     * Note: This must be a local filesystem directory path, not a remote GitHub URL.
     */
    @NotBlank(message = "Local repoPath is required")
    private String repoPath;

    /**
     * Optional execution mode flag.
     * Set sync=true for inline synchronous execution (used in test suites / scripts).
     * Defaults to false (asynchronous background execution).
     */
    @Builder.Default
    private Boolean sync = Boolean.FALSE;

    public boolean isSync() {
        return Boolean.TRUE.equals(sync);
    }
}
