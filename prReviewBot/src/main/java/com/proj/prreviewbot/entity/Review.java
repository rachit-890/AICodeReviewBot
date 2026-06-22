package com.proj.prreviewbot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pr_url", nullable = false)
    private String prUrl;

    @Column(name = "pr_title")
    private String prTitle;

    @Column(name = "repository")
    private String repository;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt;

    @Column(name = "head_commit_sha")
    private String headCommitSha;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Finding> findings = new ArrayList<>();
}