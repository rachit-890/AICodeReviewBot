package com.proj.prreviewbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExplainResponse {

    private String explanation;
    private String complexity;
    private List<String> keyComponents;
    private String securityNotes;
}
