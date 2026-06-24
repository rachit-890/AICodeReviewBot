package com.proj.prreviewbot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);

    /**
     * Returns true if request is allowed, false if rate limit exceeded.
     */
    public boolean isAllowed(String clientId) {
        String key = "rate_limit:" + clientId;

        // Increment counter
        Long count = redisTemplate.opsForValue().increment(key);

        // Set expiry only on first request in window
        if (count != null && count == 1) {
            redisTemplate.expire(key, WINDOW_DURATION);
        }

        log.debug("Rate limit check for {}: {}/{}", clientId, count, MAX_REQUESTS_PER_MINUTE);

        return count != null && count <= MAX_REQUESTS_PER_MINUTE;
    }

    public long getRemainingRequests(String clientId) {
        String key = "rate_limit:" + clientId;
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) return MAX_REQUESTS_PER_MINUTE;
        long used = Long.parseLong(value);
        return Math.max(0, MAX_REQUESTS_PER_MINUTE - used);
    }
}