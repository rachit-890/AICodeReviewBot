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
 
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
 
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
 
@ExtendWith(MockitoExtension.class)
@DisplayName("ApiKeyService Tests")
class ApiKeyServiceTest {
 
    @Mock
    private ApiKeyRepository apiKeyRepository;
 
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
        when(apiKeyRepository.findByKeyHashAndActiveTrue(anyString())).thenReturn(Optional.empty());
 
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
 
        when(apiKeyRepository.findByKeyHashAndActiveTrue(anyString())).thenReturn(Optional.of(activeKey));
 
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