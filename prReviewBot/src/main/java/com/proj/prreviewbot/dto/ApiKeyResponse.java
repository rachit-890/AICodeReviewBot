package com.proj.prreviewbot.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ApiKeyResponse {

    private UUID id;
    private String clientName;
    private String apiKey;      // only returned once on creation
    private LocalDateTime createdAt;
    private String message;
}