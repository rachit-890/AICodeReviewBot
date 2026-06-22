package com.proj.prreviewbot.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ReviewDetailResponse {

    private UUID id;
    private String prUrl;
    private String prTitle;
    private String repository;
    private String summary;
    private Integer overallScore;
    private String headCommitSha;
    private LocalDateTime reviewedAt;
    private List<FindingDetail> findings;

    @Data
    @Builder
    public static class FindingDetail {
        private UUID id;
        private String severity;
        private String category;
        private String file;
        private Integer line;
        private String title;
        private String description;
        private String suggestion;
    }
}