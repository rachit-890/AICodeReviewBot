package com.proj.prreviewbot.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class GitHubPRData {
    private String title;
    private String author;
    private String repository;
    private String headCommitSha;
    private List<String> changedFiles;
    private String combinedDiff;
}