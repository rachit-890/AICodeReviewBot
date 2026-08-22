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
 * Sanitizes and normalizes JDBC URLs (e.g. converting postgres:// or postgresql:// to jdbc:postgresql://)
 * and resolves Render internal short hostnames (dpg-xxx) to FQDNs for cloud container compatibility.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/codereviewdb}")
    private String rawUrl;

    @Value("${spring.datasource.username:rachit}")
    private String username;

    @Value("${spring.datasource.password:rachit123}")
    private String password;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = rawUrl.trim();

        // Convert postgres:// or postgresql:// scheme to jdbc:postgresql:// if provided by Render/Cloud providers
        if (url.startsWith("postgres://")) {
            url = "jdbc:postgresql://" + url.substring("postgres://".length());
        } else if (url.startsWith("postgresql://")) {
            url = "jdbc:postgresql://" + url.substring("postgresql://".length());
        } else if (!url.startsWith("jdbc:")) {
            url = "jdbc:postgresql://" + url;
        }

        // Expand bare Render internal database hostnames (e.g., dpg-d94a4imq1p3s73b6qoj0-a -> dpg-d94a4imq1p3s73b6qoj0-a.singapore-postgres.render.com)
        url = expandRenderHostname(url);

        log.info("Initializing HikariDataSource with normalized URL: {}", sanitizeUrl(url));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);

        return new HikariDataSource(config);
    }

    private String expandRenderHostname(String url) {
        // Matches short Render hostnames starting with dpg- without domain extension
        Pattern pattern = Pattern.compile("(@|//)(dpg-[a-zA-Z0-9]+)([:/?]|$)");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            String shortHost = matcher.group(2);
            String regionDomain = System.getenv().getOrDefault("RENDER_POSTGRES_DOMAIN", "singapore-postgres.render.com");
            String fullHost = shortHost + "." + regionDomain;
            log.info("Detected Render internal short host '{}'. Expanding to FQDN '{}'", shortHost, fullHost);
            url = matcher.replaceFirst(matcher.group(1) + fullHost + matcher.group(3));
        }
        return url;
    }

    private String sanitizeUrl(String url) {
        return url.replaceAll(":[^/@]+@", ":****@");
    }
}
