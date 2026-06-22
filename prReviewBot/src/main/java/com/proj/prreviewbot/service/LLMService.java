package com.proj.prreviewbot.service;



import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.prreviewbot.dto.GitHubPRData;
import com.proj.prreviewbot.dto.ReviewResponse;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class LLMService {

    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public LLMService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ReviewResponse review(GitHubPRData prData) {
        // 1. Build the model
        GoogleAiGeminiChatModel model = GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-2.5-flash")
                .build();

        // 2. Build the prompt
        String prompt = buildPrompt(prData);
        String rawResponse = model.chat(prompt);

        // 4. Parse and return
        return parseResponse(rawResponse, prData);
    }

    private String buildPrompt(GitHubPRData prData) {
        return """
            You are a senior software engineer performing a code review.
            Analyze the PR diff below and return ONLY a valid JSON object.
            No explanation, no markdown code blocks, no preamble. Just raw JSON.

            Return exactly this structure:
            {
              "summary": "one sentence overall assessment",
              "overallScore": <integer 0-100>,
              "findings": [
                {
                  "severity": "CRITICAL|WARNING|INFO",
                  "category": "SECURITY|PERFORMANCE|BUGS|STYLE",
                  "file": "filename.java",
                  "line": <integer>,
                  "title": "short title under 10 words",
                  "description": "what is wrong and why",
                  "suggestion": "how to fix it concretely"
                }
              ]
            }

            Rules:
            - Maximum 8 findings
            - CRITICAL = security hole or logic bug that breaks functionality
            - WARNING = performance issue, bad pattern, or code smell
            - INFO = style or minor improvement suggestion
            - If no issues found, return empty findings array and score of 90+

            PR Title: %s
            Repository: %s
            Changed files: %s

            Diff:
            %s
            """.formatted(
                prData.getTitle(),
                prData.getRepository(),
                String.join(", ", prData.getChangedFiles()),
                prData.getCombinedDiff()
        );
    }

    private ReviewResponse parseResponse(String raw, GitHubPRData prData) {
        try {
            // Strip markdown code fences if Gemini adds them anyway
            String cleaned = raw.strip();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned
                        .replaceAll("^```(json)?\\s*", "")
                        .replaceAll("```\\s*$", "")
                        .strip();
            }

            JsonNode root = objectMapper.readTree(cleaned);

            String summary      = root.path("summary").asText("No summary");
            int    overallScore = root.path("overallScore").asInt(70);

            List<ReviewResponse.Finding> findings = new ArrayList<>();
            for (JsonNode f : root.path("findings")) {
                findings.add(ReviewResponse.Finding.builder()
                        .severity(f.path("severity").asText("INFO"))
                        .category(f.path("category").asText("STYLE"))
                        .file(f.path("file").asText("unknown"))
                        .line(f.path("line").asInt(0))
                        .title(f.path("title").asText(""))
                        .description(f.path("description").asText(""))
                        .suggestion(f.path("suggestion").asText(""))
                        .build());
            }

            return ReviewResponse.builder()
                    .prUrl(prData.getPrUrl())
                    .prTitle(prData.getTitle())
                    .repository(prData.getRepository())
                    .summary(summary)
                    .overallScore(overallScore)
                    .findings(findings)
                    .reviewedAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse LLM response: "
                    + e.getMessage() + "\nRaw: " + raw, e);
        }
    }
}
