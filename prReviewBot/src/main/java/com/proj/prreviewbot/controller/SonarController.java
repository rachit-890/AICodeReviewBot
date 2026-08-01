package com.proj.prreviewbot.controller;

import com.proj.prreviewbot.dto.SonarReportDto;
import com.proj.prreviewbot.service.SonarQubeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/sonar")
@RequiredArgsConstructor
public class SonarController {

    private final SonarQubeService sonarQubeService;

    @GetMapping("/issues")
    public ResponseEntity<SonarReportDto> getIssues(@RequestParam(name = "projectKey", defaultValue = "prReviewBot") String projectKey) {
        log.info("Fetching SonarQube static analysis report for projectKey '{}'", projectKey);
        SonarReportDto report = sonarQubeService.getProjectIssues(projectKey);
        return ResponseEntity.ok(report);
    }
}
