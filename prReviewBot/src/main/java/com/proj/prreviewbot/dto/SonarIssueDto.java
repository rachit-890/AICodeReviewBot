package com.proj.prreviewbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SonarIssueDto {
    private String key;
    private String rule;
    private String severity;
    private String component;
    private Integer line;
    private String message;
    private String type; // VULNERABILITY, BUG, CODE_SMELL
}
