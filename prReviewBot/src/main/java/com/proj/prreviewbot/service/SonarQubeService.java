package com.proj.prreviewbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.prreviewbot.dto.SonarIssueDto;
import com.proj.prreviewbot.dto.SonarReportDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service for SonarQube Static Analysis integration (Phase 4).
 * Enriches AI PR reviews with static code quality findings and metric breakdowns.
 */
@Service
public class SonarQubeService {

    private static final Logger log = LoggerFactory.getLogger(SonarQubeService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${sonarqube.url:http://localhost:9000}")
    private String sonarUrl;

    @Value("${sonarqube.token:}")
    private String sonarToken;

    public SonarQubeService(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    /**
     * Fetches SonarQube issues for a given project key with graceful offline fallback.
     */
    public SonarReportDto getProjectIssues(String projectKey) {
        log.info("Fetching SonarQube issues for project key '{}' from '{}'", projectKey, sonarUrl);

        try {
            String apiUrl = String.format("%s/api/issues/search?componentKeys=%s&ps=100", sonarUrl, projectKey);

            HttpHeaders headers = new HttpHeaders();
            if (sonarToken != null && !sonarToken.isBlank()) {
                headers.setBearerAuth(sonarToken);
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseSonarResponse(projectKey, response.getBody());
            }
        } catch (Exception e) {
            log.warn("Could not connect to SonarQube server at '{}' for project '{}': {}", sonarUrl, projectKey, e.getMessage());
        }

        // Graceful fallback when SonarQube is unreachable or unconfigured
        return SonarReportDto.builder()
                .projectKey(projectKey)
                .totalIssues(0)
                .bugsCount(0)
                .vulnerabilitiesCount(0)
                .codeSmellsCount(0)
                .issues(Collections.emptyList())
                .build();
    }

    private SonarReportDto parseSonarResponse(String projectKey, String jsonBody) {
        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode issuesNode = root.path("issues");

            List<SonarIssueDto> issues = new ArrayList<>();
            int bugs = 0;
            int vulnerabilities = 0;
            int codeSmells = 0;

            if (issuesNode.isArray()) {
                for (JsonNode issueNode : issuesNode) {
                    String type = issueNode.path("type").asText("CODE_SMELL");
                    String severity = issueNode.path("severity").asText("MAJOR");

                    if ("BUG".equalsIgnoreCase(type)) {
                        bugs++;
                    } else if ("VULNERABILITY".equalsIgnoreCase(type)) {
                        vulnerabilities++;
                    } else {
                        codeSmells++;
                    }

                    issues.add(SonarIssueDto.builder()
                            .key(issueNode.path("key").asText())
                            .rule(issueNode.path("rule").asText())
                            .severity(severity)
                            .component(issueNode.path("component").asText())
                            .line(issueNode.path("line").asInt(0))
                            .message(issueNode.path("message").asText())
                            .type(type)
                            .build());
                }
            }

            return SonarReportDto.builder()
                    .projectKey(projectKey)
                    .totalIssues(issues.size())
                    .bugsCount(bugs)
                    .vulnerabilitiesCount(vulnerabilities)
                    .codeSmellsCount(codeSmells)
                    .issues(issues)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse SonarQube response JSON: {}", e.getMessage());
            return SonarReportDto.builder()
                    .projectKey(projectKey)
                    .totalIssues(0)
                    .bugsCount(0)
                    .vulnerabilitiesCount(0)
                    .codeSmellsCount(0)
                    .issues(Collections.emptyList())
                    .build();
        }
    }
}
