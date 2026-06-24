package com.proj.prreviewbot.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.types.Expiration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RateLimiterService Tests")
class RateLimiterServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Should allow first request")
    void shouldAllowFirstRequest() {
        when(valueOperations.increment(anyString())).thenReturn(1L);

        boolean allowed = rateLimiterService.isAllowed("test-client");

        assertTrue(allowed);
    }

    @Test
    @DisplayName("Should allow request within limit")
    void shouldAllowRequestWithinLimit() {
        when(valueOperations.increment(anyString())).thenReturn(5L);

        boolean allowed = rateLimiterService.isAllowed("test-client");

        assertTrue(allowed);
    }

    @Test
    @DisplayName("Should allow exactly 10th request")
    void shouldAllowTenthRequest() {
        when(valueOperations.increment(anyString())).thenReturn(10L);

        boolean allowed = rateLimiterService.isAllowed("test-client");

        assertTrue(allowed);
    }

    @Test
    @DisplayName("Should block 11th request")
    void shouldBlockEleventhRequest() {
        when(valueOperations.increment(anyString())).thenReturn(11L);

        boolean allowed = rateLimiterService.isAllowed("test-client");

        assertFalse(allowed);
    }

    @Test
    @DisplayName("Should block requests beyond limit")
    void shouldBlockRequestsBeyondLimit() {
        when(valueOperations.increment(anyString())).thenReturn(20L);

        boolean allowed = rateLimiterService.isAllowed("test-client");

        assertFalse(allowed);
    }

    @Test
    @DisplayName("Should set expiry on first request only")
    void shouldSetExpiryOnFirstRequest() {
        when(valueOperations.increment(anyString())).thenReturn(1L);

        rateLimiterService.isAllowed("test-client");

        verify(redisTemplate, times(1)).expire(
                eq("rate_limit:test-client"),
                eq(java.time.Duration.ofMinutes(1))
        );
    }

    @Test
    @DisplayName("Should not set expiry on subsequent requests")
    void shouldNotSetExpiryOnSubsequentRequests() {
        when(valueOperations.increment(anyString())).thenReturn(5L);

        rateLimiterService.isAllowed("test-client");

        verify(redisTemplate, never()).expire(anyString(), (Expiration) any());
    }

    @Test
    @DisplayName("Should return correct remaining requests")
    void shouldReturnCorrectRemainingRequests() {
        when(valueOperations.get(anyString())).thenReturn("3");

        long remaining = rateLimiterService.getRemainingRequests("test-client");

        assertEquals(7, remaining);
    }

    @Test
    @DisplayName("Should return max requests when no key exists")
    void shouldReturnMaxRequestsWhenNoKeyExists() {
        when(valueOperations.get(anyString())).thenReturn(null);

        long remaining = rateLimiterService.getRemainingRequests("test-client");

        assertEquals(10, remaining);
    }
}