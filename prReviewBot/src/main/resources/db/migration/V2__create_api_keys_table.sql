CREATE TABLE api_keys (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          key_hash VARCHAR(255) NOT NULL UNIQUE,
                          client_name VARCHAR(100) NOT NULL,
                          created_at TIMESTAMP NOT NULL DEFAULT now(),
                          last_used_at TIMESTAMP,
                          is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);