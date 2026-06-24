package com.proj.prreviewbot.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WebhookPayload {

    private String action;

    @JsonProperty("pull_request")
    private PullRequest pullRequest;

    private Repository repository;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PullRequest {
        private Long number;
        private String title;
        private String state;

        @JsonProperty("html_url")
        private String htmlUrl;

        private Head head;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Head {
            private String sha;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Repository {
        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("html_url")
        private String htmlUrl;
    }
}