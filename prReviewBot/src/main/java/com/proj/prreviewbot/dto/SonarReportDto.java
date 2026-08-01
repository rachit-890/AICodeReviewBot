package com.proj.prreviewbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SonarReportDto {
    private String projectKey;
    private int totalIssues;
    private int bugsCount;
    private int vulnerabilitiesCount;
    private int codeSmellsCount;
    private List<SonarIssueDto> issues;
}
