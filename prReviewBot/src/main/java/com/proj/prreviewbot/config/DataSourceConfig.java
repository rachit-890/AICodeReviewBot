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
 * Sanitizes and normalizes JDBC URLs (e.g. converting postgres:// or postgresql:// to jdbc:postgresql://),
 * extracts embedded credentials from cloud database URLs, and resolves Render hostnames.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/codereviewdb}")
    private String rawUrl;

    @Value("${spring.datasource.username:rachit}")
    private String defaultUsername;

    @Value("${spring.datasource.password:rachit123}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = rawUrl.trim();
        String activeUser = defaultUsername;
        String activePass = defaultPassword;

        // 1. Extract embedded credentials (e.g., postgres://user:password@host...) if present in URL
        Pattern credPattern = Pattern.compile("(?i)^(?:jdbc:)?postgres(?:ql)?://([^:]+):([^@]+)@(.+)$");
        Matcher credMatcher = credPattern.matcher(url);
        if (credMatcher.find()) {
            activeUser = credMatcher.group(1);
            activePass = credMatcher.group(2);
            String restOfUrl = credMatcher.group(3);
            url = "postgres://" + restOfUrl;
            log.info("Extracted embedded database username '{}' from connection URL", activeUser);
        }

        // 2. Convert postgres:// or postgresql:// scheme to jdbc:postgresql://
        if (url.startsWith("postgres://")) {
            url = "jdbc:postgresql://" + url.substring("postgres://".length());
        } else if (url.startsWith("postgresql://")) {
            url = "jdbc:postgresql://" + url.substring("postgresql://".length());
        } else if (!url.startsWith("jdbc:")) {
            url = "jdbc:postgresql://" + url;
        }

        // 3. Expand bare Render internal database hostnames
        url = expandRenderHostname(url);

        log.info("Initializing HikariDataSource with normalized URL: {}", sanitizeUrl(url));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(activeUser);
        config.setPassword(activePass);
        config.setDriverClassName(driverClassName);

        return new HikariDataSource(config);
    }

    private String expandRenderHostname(String url) {
        // Matches short Render hostnames starting with dpg- without domain extension
        Pattern pattern = Pattern.compile("(@|//)(dpg-[a-zA-Z0-9-]+)([:/?]|$)");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            String shortHost = matcher.group(2);
            if (!shortHost.contains(".")) {
                String regionDomain = System.getenv().getOrDefault("RENDER_POSTGRES_DOMAIN", "singapore-postgres.render.com");
                String fullHost = shortHost + "." + regionDomain;
                log.info("Detected Render internal short host '{}'. Expanding to FQDN '{}'", shortHost, fullHost);
                url = matcher.replaceFirst(matcher.group(1) + fullHost + matcher.group(3));
            }
        }

        // Ensure sslmode=require is present when connecting to Render databases
        if ((url.contains("render.com") || url.contains("dpg-")) && !url.contains("sslmode=")) {
            if (url.contains("?")) {
                url = url + "&sslmode=require";
            } else {
                url = url + "?sslmode=require";
            }
            log.info("Appended sslmode=require to Render database URL");
        }

        return url;
    }

    private String sanitizeUrl(String url) {
        return url.replaceAll(":[^/@]+@", ":****@");
    }
}
