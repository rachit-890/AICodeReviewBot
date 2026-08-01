package com.proj.prreviewbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocGenRequest {

    @NotBlank(message = "Repository name is required")
    private String repository;

    /**
     * Requested documentation type: README, ARCHITECTURE, API_SPEC, CHANGELOG
     */
    @NotBlank(message = "DocType is required (README, ARCHITECTURE, API_SPEC, CHANGELOG)")
    private String docType;
}
