package com.proj.prreviewbot.service;

import com.proj.prreviewbot.dto.ApiKeyRequest;
import com.proj.prreviewbot.dto.ApiKeyResponse;
import com.proj.prreviewbot.dto.ApiKeyValidationResult;
import com.proj.prreviewbot.entity.ApiKey;
import com.proj.prreviewbot.repository.ApiKeyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApiKeyService Tests")
class ApiKeyServiceTest {

    @Mock
    private ApiKeyRepository apiKeyRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private ApiKeyService apiKeyService;

    @Test
    @DisplayName("Should generate API key successfully")
    void shouldGenerateApiKeySuccessfully() {
        ApiKeyRequest request = new ApiKeyRequest();
        request.setClientName("test-client");

        ApiKey savedKey = ApiKey.builder()
                .id(UUID.randomUUID())
                .clientName("test-client")
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

        when(passwordEncoder.encode(anyString())).thenReturn("hashed-key");
        when(apiKeyRepository.save(any())).thenReturn(savedKey);

        ApiKeyResponse response = apiKeyService.generateKey(request);

        assertNotNull(response);
        assertNotNull(response.getApiKey());
        assertTrue(response.getApiKey().startsWith("rcb-"));
        assertEquals("test-client", response.getClientName());
        assertEquals("Store this key safely. It will never be shown again.",
                response.getMessage());
    }

    @Test
    @DisplayName("Should return invalid result for null API key")
    void shouldReturnInvalidForNullKey() {
        ApiKeyValidationResult result = apiKeyService.validate(null);

        assertFalse(result.isValid());
        assertEquals("Missing X-API-Key header", result.getErrorMessage());
    }

    @Test
    @DisplayName("Should return invalid result for blank API key")
    void shouldReturnInvalidForBlankKey() {
        ApiKeyValidationResult result = apiKeyService.validate("   ");

        assertFalse(result.isValid());
        assertEquals("Missing X-API-Key header", result.getErrorMessage());
    }

    @Test
    @DisplayName("Should return invalid for non-matching key")
    void shouldReturnInvalidForNonMatchingKey() {
        ApiKey activeKey = ApiKey.builder()
                .id(UUID.randomUUID())
                .keyHash("some-hash")
                .clientName("test-client")
                .active(true)
                .build();

        when(apiKeyRepository.findAll()).thenReturn(List.of(activeKey));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        ApiKeyValidationResult result = apiKeyService.validate("wrong-key");

        assertFalse(result.isValid());
        assertEquals("Invalid API key", result.getErrorMessage());
    }

    @Test
    @DisplayName("Should return valid result for matching key")
    void shouldReturnValidForMatchingKey() {
        UUID keyId = UUID.randomUUID();
        ApiKey activeKey = ApiKey.builder()
                .id(keyId)
                .keyHash("correct-hash")
                .clientName("rachit")
                .active(true)
                .build();

        when(apiKeyRepository.findAll()).thenReturn(List.of(activeKey));
        when(passwordEncoder.matches(anyString(), eq("correct-hash")))
                .thenReturn(true);

        ApiKeyValidationResult result = apiKeyService.validate("correct-raw-key");

        assertTrue(result.isValid());
        assertEquals("rachit", result.getClientId());
    }

    @Test
    @DisplayName("Should revoke key successfully")
    void shouldRevokeKeySuccessfully() {
        UUID keyId = UUID.randomUUID();
        doNothing().when(apiKeyRepository).deactivateById(keyId);

        assertDoesNotThrow(() -> apiKeyService.revokeKey(keyId));
        verify(apiKeyRepository, times(1)).deactivateById(keyId);
    }
}