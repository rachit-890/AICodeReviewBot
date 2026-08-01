package com.proj.prreviewbot.controller;

import com.proj.prreviewbot.dto.ChatRequest;
import com.proj.prreviewbot.dto.ChatResponse;
import com.proj.prreviewbot.dto.IndexRequest;
import com.proj.prreviewbot.service.RAGService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChatController {

    private final RAGService ragService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        log.info("RAG chat request for repo '{}': {}", request.getRepository(), request.getQuery());
        ChatResponse response = ragService.chatWithRepo(request.getQuery(), request.getRepository());
        return ResponseEntity.ok(response);
    }

    /**
     * Single unified indexing endpoint (Correction 5).
     * - Default (sync=false): Runs asynchronously, returns 202 ACCEPTED.
     * - Set sync=true: Runs synchronously, returns 200 OK with chunk count.
     */
    @PostMapping("/rag/index")
    public ResponseEntity<Map<String, Object>> indexRepository(@Valid @RequestBody IndexRequest request) {
        if (request.isSync()) {
            log.info("Received sync RAG index request for repo '{}' at local path '{}'", request.getRepository(), request.getRepoPath());
            int chunksIndexed = ragService.indexRepositorySync(request.getRepoPath(), request.getRepository());
            return ResponseEntity.ok(Map.of(
                    "status", "COMPLETED",
                    "repository", request.getRepository(),
                    "indexedChunks", chunksIndexed
            ));
        } else {
            log.info("Received async RAG index request for repo '{}' at local path '{}'", request.getRepository(), request.getRepoPath());
            ragService.indexRepositoryAsync(request.getRepoPath(), request.getRepository());
            return ResponseEntity.accepted().body(Map.of(
                    "status", "ACCEPTED",
                    "message", "Indexing initiated asynchronously for repository '" + request.getRepository() + "'"
            ));
        }
    }
}
