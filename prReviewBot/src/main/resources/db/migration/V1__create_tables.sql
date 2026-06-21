CREATE TABLE reviews (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         pr_url VARCHAR(500) NOT NULL,
                         pr_title VARCHAR(500),
                         repository VARCHAR(255),
                         summary TEXT,
                         overall_score INTEGER,
                         reviewed_at TIMESTAMP NOT NULL,
                         head_commit_sha VARCHAR(100)
);

CREATE TABLE findings (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
                          severity VARCHAR(20),
                          category VARCHAR(50),
                          file_path VARCHAR(500),
                          line_number INTEGER,
                          title VARCHAR(255),
                          description TEXT,
                          suggestion TEXT
);

CREATE INDEX idx_reviews_pr_url ON reviews(pr_url);
CREATE INDEX idx_findings_review_id ON findings(review_id);