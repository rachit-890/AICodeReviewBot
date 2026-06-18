package com.proj.prreviewbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ReviewRequest {

    @NotBlank(message = "PR URL is required")
    @Pattern(
            regexp = "https://github\\.com/[^/]+/[^/]+/pull/\\d+",
            message = "Must be a valid GitHub PR URL"
    )
    private String prUrl;
}
