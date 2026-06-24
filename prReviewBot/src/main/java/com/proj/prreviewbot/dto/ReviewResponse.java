package com.proj.prreviewbot.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@JsonDeserialize(builder = ReviewResponse.ReviewResponseBuilder.class)
public class ReviewResponse {

    private UUID id;
    private String prUrl;
    private String prTitle;
    private String repository;
    private String summary;
    private int overallScore;
    private List<Finding> findings;
    private LocalDateTime reviewedAt;

    @JsonPOJOBuilder(withPrefix = "")
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ReviewResponseBuilder {}

    @Data
    @Builder
    @JsonDeserialize(builder = Finding.FindingBuilder.class)
    public static class Finding {
        private String severity;
        private String category;
        private String file;
        private int line;
        private String title;
        private String description;
        private String suggestion;

        @JsonPOJOBuilder(withPrefix = "")
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class FindingBuilder {}
    }
}