package com.proj.prreviewbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyMetadata {
    private UUID id;
    private String clientName;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    private boolean active;
}
