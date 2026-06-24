package com.proj.prreviewbot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.prreviewbot.dto.WebhookPayload;
import com.proj.prreviewbot.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;
    private final ObjectMapper objectMapper;

    @PostMapping("/github")
    public ResponseEntity<Map<String, String>> handleGitHubWebhook(
            @RequestHeader(value = "X-Hub-Signature-256",
                    required = false) String signature,
            @RequestHeader(value = "X-GitHub-Event",
                    defaultValue = "unknown") String event,
            @RequestBody String rawPayload) {

        log.info("Received GitHub webhook event: {}", event);

        // 1. Verify signature
        if (!webhookService.verifySignature(rawPayload, signature)) {
            log.warn("Invalid webhook signature");
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid signature"));
        }

        // 2. Only process pull_request events
        if (!"pull_request".equals(event)) {
            log.info("Ignoring non-PR event: {}", event);
            return ResponseEntity.ok(
                    Map.of("message", "Event ignored: " + event));
        }

        // 3. Parse payload
        try {
            WebhookPayload payload = objectMapper.readValue(
                    rawPayload, WebhookPayload.class);

            // 4. Process asynchronously — return 200 immediately
            webhookService.processWebhook(payload);

            return ResponseEntity.ok(
                    Map.of("message", "Webhook received, processing started"));

        } catch (Exception e) {
            log.error("Failed to parse webhook payload: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid payload"));
        }
    }
}