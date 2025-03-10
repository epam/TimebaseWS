package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

public class TokenUtils {

    private static final Log LOGGER = LogFactory.getLog(ApiKeyUtils.class);

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Token {
        public String access_token;
    }

    public static String requestToken(RestTemplate restTemplate, String user, String password) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/x-www-form-urlencoded");
        HttpEntity entity = new HttpEntity<>(
            String.format("client_id=%s&client_secret=%s&grant_type=client_credentials&scope=openid profile", user, password),
            headers
        );

        ResponseEntity<String> response = restTemplate.exchange("/oauth2/token", HttpMethod.POST, entity, String.class);

        return new ObjectMapper().readValue(response.getBody(), Token.class).access_token;
    }

}
