package com.proj.prreviewbot.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiKeyValidationResult {
    private boolean valid;
    private String clientId;
    private String errorMessage;
}