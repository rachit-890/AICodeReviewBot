package com.proj.prreviewbot.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Custom DataSource configuration for Spring Boot.
 * Normalizes JDBC URLs, safely extracts credentials (handling '@' in passwords),
 * validates Render host types (internal vs external FQDN), and configures HikariCP.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/codereviewdb}")
    private String defaultUrl;

    @Value("${spring.datasource.username:rachit}")
    private String defaultUsername;

    @Value("${spring.datasource.password:rachit123}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = selectBestConnectionUrl();
        String url = rawUrl.trim();

        String activeUser = defaultUsername;
        String activePass = defaultPassword;

        // 1. Extract embedded credentials, matching greedily until the last '@' before hostname to handle '@' in passwords
        Pattern credPattern = Pattern.compile("(?i)^(?:jdbc:)?postgres(?:ql)?://([^:]+):(.+)@([^/@]+)(/.*)?$");
        Matcher credMatcher = credPattern.matcher(url);
        if (credMatcher.find()) {
            activeUser = credMatcher.group(1);
            activePass = credMatcher.group(2);
            String hostAndPath = credMatcher.group(3) + (credMatcher.group(4) != null ? credMatcher.group(4) : "");
            url = "postgres://" + hostAndPath;
            log.info("Extracted embedded database username '{}' from connection URL", activeUser);
        } else {
            String envUser = resolveEnv("SPRING_DATASOURCE_USERNAME", "POSTGRES_USER", "POSTGRES_USERNAME", "DB_USERNAME");
            if (envUser != null && !envUser.isEmpty()) activeUser = envUser;

            String envPass = resolveEnv("SPRING_DATASOURCE_PASSWORD", "POSTGRES_PASSWORD", "DB_PASSWORD");
            if (envPass != null && !envPass.isEmpty()) activePass = envPass;
        }

        // 2. Convert postgres:// or postgresql:// scheme to jdbc:postgresql://
        if (url.startsWith("postgres://")) {
            url = "jdbc:postgresql://" + url.substring("postgres://".length());
        } else if (url.startsWith("postgresql://")) {
            url = "jdbc:postgresql://" + url.substring("postgresql://".length());
        } else if (!url.startsWith("jdbc:")) {
            url = "jdbc:postgresql://" + url;
        }

        // 3. Process Render database host validation and SSL requirements
        url = processRenderUrl(url);

        log.info("Initializing HikariDataSource for user '{}' with URL: {}", activeUser, sanitizeUrl(url));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(activeUser);
        config.setPassword(activePass);
        config.setDriverClassName(driverClassName);

        return new HikariDataSource(config);
    }

    private String selectBestConnectionUrl() {
        String[] candidates = {
            System.getenv("DATABASE_URL"),
            System.getenv("SPRING_DATASOURCE_URL"),
            System.getenv("POSTGRES_URL")
        };

        // 1. Scan for candidate containing embedded credentials (@)
        for (String candidate : candidates) {
            if (candidate != null && candidate.contains("@") && !candidate.trim().isEmpty()) {
                return candidate.trim();
            }
        }

        // 2. Scan for any non-empty candidate
        for (String candidate : candidates) {
            if (candidate != null && !candidate.trim().isEmpty()) {
                return candidate.trim();
            }
        }

        return defaultUrl;
    }

    private String processRenderUrl(String url) {
        Pattern hostPattern = Pattern.compile("(?i)^jdbc:postgresql://([^:/?]+)(?::\\d+)?(?:/.*)?$");
        Matcher matcher = hostPattern.matcher(url);

        if (matcher.find()) {
            String host = matcher.group(1);

            // Fail fast if a bare internal Render hostname (no dot) is provided
            if (host.matches("^dpg-[a-zA-Z0-9-]+$") && !host.contains(".")) {
                throw new IllegalStateException(
                    "Invalid Render Database configuration: An internal-format host ('" + host + "') was provided. " +
                    "Render internal hostnames cannot be resolved outside their internal network or guessed into FQDNs. " +
                    "To fix this: (a) If your web service and database are in the same Render region, use the Internal Connection String unmodified with SSL disabled, or " +
                    "(b) If connecting across regions or externally, use Render's External Database URL (e.g. 'dpg-xxxx-a.<region>-postgres.render.com') in your environment variables."
                );
            }

            // Only append sslmode=require if host is a fully-qualified external Render host (contains a dot)
            if ((host.contains("render.com") || host.startsWith("dpg-")) && host.contains(".")) {
                if (!url.contains("sslmode=")) {
                    if (url.contains("?")) {
                        url = url + "&sslmode=require";
                    } else {
                        url = url + "?sslmode=require";
                    }
                    log.info("Appended sslmode=require to external Render database URL");
                }
            }
        }

        return url;
    }

    private String resolveEnv(String... envVarNames) {
        for (String varName : envVarNames) {
            String val = System.getenv(varName);
            if (val != null && !val.trim().isEmpty()) {
                return val.trim();
            }
        }
        return null;
    }

    private String sanitizeUrl(String url) {
        return url.replaceAll(":[^/@]+@", ":****@");
    }
}
