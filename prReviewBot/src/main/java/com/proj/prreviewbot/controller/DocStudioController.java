package com.proj.prreviewbot.controller;

import com.proj.prreviewbot.dto.DocGenRequest;
import com.proj.prreviewbot.dto.DocGenResponse;
import com.proj.prreviewbot.dto.ExplainRequest;
import com.proj.prreviewbot.dto.ExplainResponse;
import com.proj.prreviewbot.service.DocStudioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/doc")
@RequiredArgsConstructor
public class DocStudioController {

    private final DocStudioService docStudioService;

    @PostMapping("/explain")
    public ResponseEntity<ExplainResponse> explainCode(@Valid @RequestBody ExplainRequest request) {
        log.info("Code explanation request received for language '{}'", request.getLanguage());
        ExplainResponse response = docStudioService.explainCode(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    public ResponseEntity<DocGenResponse> generateDoc(@Valid @RequestBody DocGenRequest request) {
        log.info("Doc generation request received: type '{}', repo '{}'", request.getDocType(), request.getRepository());
        DocGenResponse response = docStudioService.generateDoc(request);
        return ResponseEntity.ok(response);
    }
}
