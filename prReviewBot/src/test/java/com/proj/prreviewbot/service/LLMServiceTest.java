package com.proj.prreviewbot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.proj.prreviewbot.dto.GitHubPRData;
import com.proj.prreviewbot.dto.ReviewResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LLMService Tests")
class LLMServiceTest {

    @InjectMocks
    private LLMService llmService;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        ReflectionTestUtils.setField(llmService, "geminiApiKey", "test-key");
        ReflectionTestUtils.setField(llmService, "objectMapper", objectMapper);
    }

    @Test
    @DisplayName("Should parse valid LLM JSON response correctly")
    void shouldParseValidLLMResponse() throws Exception {
        String validJson = """
            {
              "summary": "Code looks good overall",
              "overallScore": 85,
              "findings": [
                {
                  "severity": "WARNING",
                  "category": "PERFORMANCE",
                  "file": "PaymentService.java",
                  "line": 42,
                  "title": "N+1 query detected",
                  "description": "Fetching orders in a loop",
                  "suggestion": "Use batch loading"
                }
              ]
            }
            """;

        // Use reflection to call private parseResponse method
        GitHubPRData prData = GitHubPRData.builder()
                .prUrl("https://github.com/test/repo/pull/1")
                .title("Test PR")
                .repository("test/repo")
                .headCommitSha("abc123")
                .changedFiles(List.of("PaymentService.java"))
                .combinedDiff("test diff")
                .build();

        var method = LLMService.class.getDeclaredMethod(
                "parseResponse", String.class, GitHubPRData.class);
        method.setAccessible(true);

        ReviewResponse response = (ReviewResponse) method.invoke(
                llmService, validJson, prData);

        assertNotNull(response);
        assertEquals(85, response.getOverallScore());
        assertEquals("Code looks good overall", response.getSummary());
        assertEquals(1, response.getFindings().size());
        assertEquals("WARNING", response.getFindings().get(0).getSeverity());
        assertEquals("PERFORMANCE", response.getFindings().get(0).getCategory());
    }

    @Test
    @DisplayName("Should strip markdown code fences from LLM response")
    void shouldStripMarkdownFences() throws Exception {
        String jsonWithFences = """
```json
            {
              "summary": "Looks good",
              "overallScore": 90,
              "findings": []
            }
```
            """;

        GitHubPRData prData = GitHubPRData.builder()
                .prUrl("https://github.com/test/repo/pull/1")
                .title("Test PR")
                .repository("test/repo")
                .headCommitSha("abc123")
                .changedFiles(List.of())
                .combinedDiff("")
                .build();

        var method = LLMService.class.getDeclaredMethod(
                "parseResponse", String.class, GitHubPRData.class);
        method.setAccessible(true);

        ReviewResponse response = (ReviewResponse) method.invoke(
                llmService, jsonWithFences, prData);

        assertNotNull(response);
        assertEquals(90, response.getOverallScore());
        assertEquals(0, response.getFindings().size());
    }

    @Test
    @DisplayName("Should throw RuntimeException for malformed JSON")
    void shouldThrowExceptionForMalformedJson() throws Exception {
        String malformedJson = "this is not json at all {{{}}}";

        GitHubPRData prData = GitHubPRData.builder()
                .prUrl("https://github.com/test/repo/pull/1")
                .title("Test PR")
                .repository("test/repo")
                .headCommitSha("abc123")
                .changedFiles(List.of())
                .combinedDiff("")
                .build();

        var method = LLMService.class.getDeclaredMethod(
                "parseResponse", String.class, GitHubPRData.class);
        method.setAccessible(true);

        assertThrows(Exception.class, () ->
                method.invoke(llmService, malformedJson, prData)
        );
    }

    @Test
    @DisplayName("Should handle empty findings array")
    void shouldHandleEmptyFindings() throws Exception {
        String jsonNoFindings = """
            {
              "summary": "No issues found",
              "overallScore": 95,
              "findings": []
            }
            """;

        GitHubPRData prData = GitHubPRData.builder()
                .prUrl("https://github.com/test/repo/pull/1")
                .title("Clean PR")
                .repository("test/repo")
                .headCommitSha("abc123")
                .changedFiles(List.of())
                .combinedDiff("")
                .build();

        var method = LLMService.class.getDeclaredMethod(
                "parseResponse", String.class, GitHubPRData.class);
        method.setAccessible(true);

        ReviewResponse response = (ReviewResponse) method.invoke(
                llmService, jsonNoFindings, prData);

        assertNotNull(response);
        assertEquals(95, response.getOverallScore());
        assertTrue(response.getFindings().isEmpty());
    }
}