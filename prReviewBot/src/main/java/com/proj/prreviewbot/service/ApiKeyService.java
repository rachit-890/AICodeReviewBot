package com.proj.prreviewbot.service;

import com.proj.prreviewbot.dto.ApiKeyValidationResult;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ApiKeyService {

    private static final Map<String, String> VALID_KEYS = new ConcurrentHashMap<>(Map.of(
            "test-key-rachit-001", "rachit",
            "test-key-rachit-002", "rachit-dev"
    ));

    public ApiKeyValidationResult validate(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            return ApiKeyValidationResult.builder()
                    .valid(false)
                    .errorMessage("Missing X-API-Key header")
                    .build();
        }

        String clientId = VALID_KEYS.get(apiKey);
        if (clientId == null) {
            return ApiKeyValidationResult.builder()
                    .valid(false)
                    .errorMessage("Invalid API key")
                    .build();
        }

        return ApiKeyValidationResult.builder()
                .valid(true)
                .clientId(clientId)
                .build();
    }
}