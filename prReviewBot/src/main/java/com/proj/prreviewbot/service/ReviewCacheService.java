package com.proj.prreviewbot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.prreviewbot.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final Duration CACHE_TTL = Duration.ofHours(1);

    public void cacheReview(String prUrl, String commitSha, ReviewResponse response) {
        String key = buildCacheKey(prUrl, commitSha);
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL);
            log.info("Cached review for key: {}", key);
        } catch (Exception e) {
            log.warn("Failed to cache review: {}", e.getMessage());
        }
    }

    public ReviewResponse getCachedReview(String prUrl, String commitSha) {
        String key = buildCacheKey(prUrl, commitSha);
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                log.info("Cache hit for key: {}", key);
                return objectMapper.readValue(json, ReviewResponse.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read cached review: {}", e.getMessage());
        }
        return null;
    }

    private String buildCacheKey(String prUrl, String commitSha) {
        return "review_cache:" + prUrl.hashCode() + ":" + commitSha;
    }
}