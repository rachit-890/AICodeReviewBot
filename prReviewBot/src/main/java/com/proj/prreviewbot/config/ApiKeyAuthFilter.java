package com.proj.prreviewbot.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.prreviewbot.dto.ApiKeyValidationResult;
import com.proj.prreviewbot.service.ApiKeyService;
import com.proj.prreviewbot.service.RateLimiterService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;
    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip filter for health endpoints
        if (path.startsWith("/actuator") ||
                path.equals("/api/v1/health-check") ||
                path.equals("/api/v1/keys/generate")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. Validate API key
        String apiKey = request.getHeader("X-API-Key");
        ApiKeyValidationResult validation = apiKeyService.validate(apiKey);

        if (!validation.isValid()) {
            writeErrorResponse(response, 401, validation.getErrorMessage());
            return;
        }

        // 2. Check rate limit
        if (!rateLimiterService.isAllowed(validation.getClientId())) {
            long remaining = rateLimiterService.getRemainingRequests(validation.getClientId());
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
            response.setHeader("X-RateLimit-Limit", "10");
            writeErrorResponse(response, 429, "Rate limit exceeded. Max 10 requests per minute.");
            return;
        }

        // 3. Add remaining requests header
        response.setHeader("X-RateLimit-Remaining",
                String.valueOf(rateLimiterService.getRemainingRequests(validation.getClientId())));
        response.setHeader("X-RateLimit-Limit", "10");

        // 4. Pass client ID to controller via request attribute
        request.setAttribute("clientId", validation.getClientId());

        filterChain.doFilter(request, response);
    }

    private void writeErrorResponse(HttpServletResponse response,
                                    int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String body = objectMapper.writeValueAsString(Map.of(
                "status", status,
                "error", message,
                "timestamp", LocalDateTime.now().toString()
        ));
        response.getWriter().write(body);
    }
}