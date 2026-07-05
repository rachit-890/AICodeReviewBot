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

    // Thread-safe in-memory fallback for rate limiting when Redis is down
    private final java.util.Map<String, RequestCounter> localLimits = new java.util.concurrent.ConcurrentHashMap<>();

    private static class RequestCounter {
        private final java.util.concurrent.atomic.AtomicInteger count = new java.util.concurrent.atomic.AtomicInteger(0);
        private volatile long windowStart = System.currentTimeMillis();

        public int incrementAndGet() {
            long now = System.currentTimeMillis();
            if (now - windowStart > 60000) {
                synchronized (this) {
                    if (now - windowStart > 60000) {
                        count.set(0);
                        windowStart = now;
                    }
                }
            }
            return count.incrementAndGet();
        }

        public int get() {
            long now = System.currentTimeMillis();
            if (now - windowStart > 60000) {
                return 0;
            }
            return count.get();
        }
    }

    /**
     * Returns true if request is allowed, false if rate limit exceeded.
     */
    public boolean isAllowed(String clientId) {
        String key = "rate_limit:" + clientId;

        try {
            // Increment counter
            Long count = redisTemplate.opsForValue().increment(key);

            // Set expiry only on first request in window
            if (count != null && count == 1) {
                redisTemplate.expire(key, WINDOW_DURATION);
            }

            log.debug("Rate limit check for {}: {}/{}", clientId, count, MAX_REQUESTS_PER_MINUTE);

            return count != null && count <= MAX_REQUESTS_PER_MINUTE;
        } catch (Exception e) {
            log.warn("Redis unavailable. Using in-memory fallback rate limiter for client: {}", clientId);
            RequestCounter counter = localLimits.computeIfAbsent(clientId, k -> new RequestCounter());
            int count = counter.incrementAndGet();
            return count <= MAX_REQUESTS_PER_MINUTE;
        }
    }

    public long getRemainingRequests(String clientId) {
        String key = "rate_limit:" + clientId;
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value == null) return MAX_REQUESTS_PER_MINUTE;
            long used = Long.parseLong(value);
            return Math.max(0, MAX_REQUESTS_PER_MINUTE - used);
        } catch (Exception e) {
            RequestCounter counter = localLimits.get(clientId);
            int used = counter != null ? counter.get() : 0;
            return Math.max(0, MAX_REQUESTS_PER_MINUTE - used);
        }
    }
}