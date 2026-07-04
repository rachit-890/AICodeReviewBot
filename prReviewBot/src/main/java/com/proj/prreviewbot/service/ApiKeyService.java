package com.proj.prreviewbot.service;
 
import com.proj.prreviewbot.dto.ApiKeyRequest;
import com.proj.prreviewbot.dto.ApiKeyResponse;
import com.proj.prreviewbot.dto.ApiKeyValidationResult;
import com.proj.prreviewbot.entity.ApiKey;
import com.proj.prreviewbot.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.proj.prreviewbot.dto.ApiKeyMetadata;
 
@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {
 
    private final ApiKeyRepository apiKeyRepository;
 
    @Transactional
    public ApiKeyResponse generateKey(ApiKeyRequest request) {
        // 1. Generate a random key
        String rawKey = "rcb-" + UUID.randomUUID().toString().replace("-", "");
 
        // 2. Hash it before storing
        String hashedKey = hashKey(rawKey);
 
        // 3. Save to database
        ApiKey apiKey = ApiKey.builder()
                .keyHash(hashedKey)
                .clientName(request.getClientName())
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();
 
        ApiKey saved = apiKeyRepository.save(apiKey);
        log.info("Generated API key for client: {}", request.getClientName());
 
        // 4. Return raw key ONCE — never stored in plain text
        return ApiKeyResponse.builder()
                .id(saved.getId())
                .clientName(saved.getClientName())
                .apiKey(rawKey)
                .createdAt(saved.getCreatedAt())
                .message("Store this key safely. It will never be shown again.")
                .build();
    }
 
    @Transactional
    public ApiKeyValidationResult validate(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            return ApiKeyValidationResult.builder()
                    .valid(false)
                    .errorMessage("Missing X-API-Key header")
                    .build();
        }
 
        String hashedKey = hashKey(rawKey);
        Optional<ApiKey> matchedKey = apiKeyRepository.findByKeyHashAndActiveTrue(hashedKey);
 
        if (matchedKey.isEmpty()) {
            return ApiKeyValidationResult.builder()
                    .valid(false)
                    .errorMessage("Invalid API key")
                    .build();
        }
 
        ApiKey key = matchedKey.get();
 
        // Update last used timestamp
        apiKeyRepository.updateLastUsed(key.getId(), LocalDateTime.now());
 
        return ApiKeyValidationResult.builder()
                .valid(true)
                .clientId(key.getClientName())
                .keyId(key.getId())
                .build();
    }
 
    @Transactional
    public void revokeKey(UUID id) {
        apiKeyRepository.deactivateById(id);
        log.info("Revoked API key: {}", id);
    }
 
    @Transactional(readOnly = true)
    public List<ApiKeyMetadata> listAllKeys() {
        return apiKeyRepository.findAll().stream()
                .map(key -> ApiKeyMetadata.builder()
                        .id(key.getId())
                        .clientName(key.getClientName())
                        .createdAt(key.getCreatedAt())
                        .lastUsedAt(key.getLastUsedAt())
                        .active(key.isActive())
                        .build())
                .collect(Collectors.toList());
    }
 
    private String hashKey(String rawKey) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash API key", e);
        }
    }
}