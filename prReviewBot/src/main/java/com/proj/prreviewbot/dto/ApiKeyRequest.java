package com.proj.prreviewbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApiKeyRequest {

    @NotBlank(message = "Client name is required")
    private String clientName;
}