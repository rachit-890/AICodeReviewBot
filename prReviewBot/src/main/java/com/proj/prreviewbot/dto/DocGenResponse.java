package com.proj.prreviewbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocGenResponse {

    private String repository;
    private String docType;
    private String markdownContent;
    private LocalDateTime generatedAt;
}
