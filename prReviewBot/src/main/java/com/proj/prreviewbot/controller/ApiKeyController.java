package com.proj.prreviewbot.controller;

import com.proj.prreviewbot.dto.ApiKeyRequest;
import com.proj.prreviewbot.dto.ApiKeyResponse;
import com.proj.prreviewbot.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @PostMapping("/generate")
    public ResponseEntity<ApiKeyResponse> generate(
            @Valid @RequestBody ApiKeyRequest request) {
        return ResponseEntity.ok(apiKeyService.generateKey(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> revoke(@PathVariable UUID id) {
        apiKeyService.revokeKey(id);
        return ResponseEntity.ok(Map.of(
                "message", "API key revoked successfully",
                "id", id.toString()
        ));
    }
}