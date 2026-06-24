package com.proj.prreviewbot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubService Tests")
class GitHubServiceTest {

    private GitHubService gitHubService;

    @Mock
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Manually build WebClient.Builder with real implementation
        WebClient.Builder realBuilder = WebClient.builder();

        // Manually construct service — bypass @InjectMocks
        gitHubService = new GitHubService(realBuilder, objectMapper);
        ReflectionTestUtils.setField(gitHubService, "githubToken", "test-token");
    }

    @Test
    @DisplayName("Should throw exception for invalid PR URL")
    void shouldThrowExceptionForInvalidUrl() {
        assertThrows(IllegalArgumentException.class, () ->
                gitHubService.fetchPRData("not-a-valid-url")
        );
    }

    @Test
    @DisplayName("Should throw exception for non-GitHub URL")
    void shouldThrowExceptionForNonGitHubUrl() {
        assertThrows(IllegalArgumentException.class, () ->
                gitHubService.fetchPRData("https://gitlab.com/owner/repo/pull/1")
        );
    }

    @Test
    @DisplayName("Should throw exception for missing PR number")
    void shouldThrowExceptionForMissingPrNumber() {
        assertThrows(IllegalArgumentException.class, () ->
                gitHubService.fetchPRData("https://github.com/owner/repo")
        );
    }

    @Test
    @DisplayName("Should throw exception for null URL")
    void shouldThrowExceptionForNullUrl() {
        assertThrows(IllegalArgumentException.class, () ->
                gitHubService.fetchPRData(null)
        );
    }

    @Test
    @DisplayName("Should throw exception for empty URL")
    void shouldThrowExceptionForEmptyUrl() {
        assertThrows(IllegalArgumentException.class, () ->
                gitHubService.fetchPRData("")
        );
    }
}