package com.proj.prreviewbot.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {

    private UUID id;
    private String prUrl;
    private String prTitle;
    private String repository;
    private String summary;
    private int overallScore;
    private List<Finding> findings;
    private LocalDateTime reviewedAt;



    @Data
    @Builder
    public static class Finding {
        private String severity;    // CRITICAL, WARNING, INFO
        private String category;    // SECURITY, PERFORMANCE, BUGS, STYLE
        private String file;
        private int line;
        private String title;
        private String description;
        private String suggestion;
    }
}