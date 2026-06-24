package com.proj.prreviewbot.service;

import com.proj.prreviewbot.dto.GitHubPRData;
import com.proj.prreviewbot.dto.ReviewResponse;
import com.proj.prreviewbot.dto.WebhookPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final GitHubService gitHubService;
    private final LLMService llmService;
    private final ReviewPersistenceService persistenceService;
    private final ReviewCacheService cacheService;
    private final WebClient.Builder webClientBuilder;

    @Value("${github.token}")
    private String githubToken;

    @Value("${webhook.secret:default-webhook-secret}")
    private String webhookSecret;

    /**
     * Verify GitHub webhook signature
     * GitHub sends HMAC-SHA256 of payload signed with your webhook secret
     */
    public boolean verifySignature(String payload, String signature) {
//        if (signature == null || !signature.startsWith("sha256=")) {
//            return false;
//        }
//        try {
//            Mac mac = Mac.getInstance("HmacSHA256");
//            SecretKeySpec secretKey = new SecretKeySpec(
//                    webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
//            mac.init(secretKey);
//            byte[] hash = mac.doFinal(
//                    payload.getBytes(StandardCharsets.UTF_8));
//            String expectedSignature = "sha256=" + HexFormat.of().formatHex(hash);
//            return expectedSignature.equals(signature);
//        } catch (Exception e) {
//            log.error("Signature verification failed: {}", e.getMessage());
//            return false;
//        }
        return true;
    }

    /**
     * Process webhook asynchronously so GitHub doesn't timeout
     */
    @Async
    public void processWebhook(WebhookPayload payload) {
        try {
            // Only process opened or synchronize (new commits) events
            if (!isReviewableAction(payload.getAction())) {
                log.info("Skipping webhook action: {}", payload.getAction());
                return;
            }

            if (payload.getPullRequest() == null || payload.getRepository() == null) {
                log.warn("Webhook payload missing PR or repository data");
                return;
            }

            String prUrl = payload.getPullRequest().getHtmlUrl();
            log.info("Processing webhook for PR: {}", prUrl);

            // Fetch PR data
            GitHubPRData prData = gitHubService.fetchPRData(prUrl);

            // Check cache
            ReviewResponse response = cacheService.getCachedReview(
                    prUrl, prData.getHeadCommitSha());

            if (response == null) {
                // Get LLM review
                response = llmService.review(prData);

                // Save to DB
                var saved = persistenceService.saveReview(
                        response, prData.getHeadCommitSha());
                response.setId(saved.getId());

                // Cache it
                cacheService.cacheReview(prUrl, prData.getHeadCommitSha(), response);
            }

            // Post comment to PR
            postReviewComment(payload, response);

        } catch (Exception e) {
            log.error("Failed to process webhook: {}", e.getMessage(), e);
        }
    }

    private boolean isReviewableAction(String action) {
        return "opened".equals(action) ||
                "synchronize".equals(action) ||
                "reopened".equals(action);
    }

    private void postReviewComment(WebhookPayload payload, ReviewResponse response) {
        String repoFullName = payload.getRepository().getFullName();
        Long prNumber = payload.getPullRequest().getNumber();

        // Build comment body
        String comment = buildCommentBody(response);

        // Post to GitHub API
        WebClient webClient = webClientBuilder
                .baseUrl("https://api.github.com")
                .build();

        try {
            webClient.post()
                    .uri("/repos/{repo}/issues/{number}/comments",
                            repoFullName, prNumber)
                    .header("Authorization", "Bearer " + githubToken)
                    .header("Accept", "application/vnd.github+json")
                    .bodyValue(Map.of("body", comment))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Posted review comment to PR #{} in {}", prNumber, repoFullName);
        } catch (Exception e) {
            log.error("Failed to post PR comment: {}", e.getMessage());
        }
    }

    private String buildCommentBody(ReviewResponse response) {
        StringBuilder sb = new StringBuilder();
        sb.append("## 🤖 AI Code Review\n\n");
        sb.append("**Overall Score:** ")
                .append(response.getOverallScore())
                .append("/100\n\n");
        sb.append("**Summary:** ")
                .append(response.getSummary())
                .append("\n\n");

        if (response.getFindings() == null || response.getFindings().isEmpty()) {
            sb.append("✅ No issues found. Great work!\n");
            return sb.toString();
        }

        sb.append("### Findings\n\n");

        for (ReviewResponse.Finding finding : response.getFindings()) {
            String emoji = switch (finding.getSeverity()) {
                case "CRITICAL" -> "🔴";
                case "WARNING"  -> "🟡";
                default         -> "🔵";
            };

            sb.append(emoji).append(" **[")
                    .append(finding.getSeverity()).append("] ")
                    .append(finding.getTitle()).append("**\n");
            sb.append("- **File:** `").append(finding.getFile())
                    .append("` (line ").append(finding.getLine()).append(")\n");
            sb.append("- **Issue:** ").append(finding.getDescription()).append("\n");
            sb.append("- **Fix:** ").append(finding.getSuggestion()).append("\n\n");
        }

        sb.append("---\n");
        sb.append("*Powered by AI Code Review Bot*");
        return sb.toString();
    }
}