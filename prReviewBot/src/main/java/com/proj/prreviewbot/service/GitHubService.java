package com.proj.prreviewbot.service;
import com.proj.prreviewbot.dto.GitHubPRData;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GitHubService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${github.token}")
    private String githubToken;

    private static final Pattern PR_URL_PATTERN =
            Pattern.compile("https://github\\.com/([^/]+)/([^/]+)/pull/(\\d+)");

    private static final int MAX_DIFF_CHARS = 16000;

    public GitHubService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
                .baseUrl("https://api.github.com")
                .build();
        this.objectMapper = objectMapper;
    }

    public GitHubPRData fetchPRData(String prUrl) {

        if (prUrl == null || prUrl.isBlank()) {
            throw new IllegalArgumentException("PR URL cannot be null or empty");
        }

        // 1. Parse the URL
        Matcher matcher = PR_URL_PATTERN.matcher(prUrl);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid GitHub PR URL: " + prUrl);
        }
        String owner    = matcher.group(1);
        String repo     = matcher.group(2);
        int    prNumber = Integer.parseInt(matcher.group(3));

        // 2. Fetch PR metadata
        String prMetadataJson = webClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{number}", owner, repo, prNumber)
                .header("Authorization", "Bearer " + githubToken)
                .header("Accept", "application/vnd.github+json")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // 3. Fetch changed files
        String filesJson = webClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{number}/files", owner, repo, prNumber)
                .header("Authorization", "Bearer " + githubToken)
                .header("Accept", "application/vnd.github+json")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // 4. Pass prUrl into parsePRData
        return parsePRData(prMetadataJson, filesJson, owner, repo, prUrl);
    }

    private GitHubPRData parsePRData(String metaJson, String filesJson,
                                     String owner, String repo, String prUrl) {
        try {
            JsonNode meta  = objectMapper.readTree(metaJson);
            JsonNode files = objectMapper.readTree(filesJson);

            String title         = meta.path("title").asText("No title");
            String author        = meta.path("user").path("login").asText("unknown");
            String headCommitSha = meta.path("head").path("sha").asText("");

            List<String> changedFiles = new ArrayList<>();
            StringBuilder diffBuilder = new StringBuilder();

            for (JsonNode file : files) {
                String filename = file.path("filename").asText();
                String status   = file.path("status").asText();
                String patch    = file.path("patch").asText("");

                changedFiles.add(filename);

                diffBuilder.append("=== ").append(filename)
                        .append(" (").append(status).append(") ===\n");

                if (!patch.isEmpty()) {
                    diffBuilder.append(patch).append("\n\n");
                }
            }

            String fullDiff = diffBuilder.toString();
            if (fullDiff.length() > MAX_DIFF_CHARS) {
                fullDiff = fullDiff.substring(0, MAX_DIFF_CHARS)
                        + "\n\n[DIFF TRUNCATED]";
            }

            return GitHubPRData.builder()
                    .prUrl(prUrl)              // ← now resolves correctly
                    .title(title)
                    .author(author)
                    .repository(owner + "/" + repo)
                    .headCommitSha(headCommitSha)
                    .changedFiles(changedFiles)
                    .combinedDiff(fullDiff)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse GitHub API response: "
                    + e.getMessage(), e);
        }
    }
}
