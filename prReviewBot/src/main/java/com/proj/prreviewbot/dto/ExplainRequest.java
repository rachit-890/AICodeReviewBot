package com.proj.prreviewbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExplainRequest {

    @NotBlank(message = "Code snippet is required")
    private String code;

    @Builder.Default
    private String language = "java";

    private String context;
}
