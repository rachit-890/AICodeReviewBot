package com.proj.prreviewbot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PrReviewBotApplication {

    public static void main(String[] args) {
        SpringApplication.run(PrReviewBotApplication.class, args);
    }
}