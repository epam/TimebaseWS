/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.epam.deltix.tbwg.webapp.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.model.LoginAttemptDto;
import com.epam.deltix.spring.apikeys.model.LoginConfirmationDto;
import com.epam.deltix.spring.apikeys.model.SuccessfulLoginAttemptDto;
import com.epam.deltix.spring.apikeys.model.SuccessfulLoginConfirmationDto;
import com.epam.deltix.spring.apikeys.utils.RsaUtils;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collections;

public class SessionLoginUtils {

    private static final Log LOGGER = LogFactory.getLog(SessionRestSample.class);

    private static final int DH_SECRET_SIZE = 1024;
    private static final String LOGIN_ATTEMPT_PREFIX = "/session/login/attempt";
    private static final String LOGIN_CONFIRM_PREFIX = "/session/login/confirm";

    public static class SessionDto {
        public String sessionId;
        public byte[] dhSessionSecret;
        public long keepAliveMs;
    }

    private final static ObjectMapper objectMapper = new ObjectMapper();

    public static SessionDto login(RestTemplate restTemplate, String sessionApiKey, String privateKey) {
        return loginConfirm(restTemplate, loginRequest(restTemplate, sessionApiKey), privateKey);
    }

    private static SuccessfulLoginAttemptDto loginRequest(RestTemplate restTemplate, String apiKeyId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        LoginAttemptDto attemptDto = new LoginAttemptDto();
        attemptDto.setApiKeyId(apiKeyId);

        try {
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(attemptDto), headers);
            return rest(restTemplate, HttpMethod.POST, LOGIN_ATTEMPT_PREFIX, entity, SuccessfulLoginAttemptDto.class)
                .getBody();
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private static SessionDto loginConfirm(RestTemplate restTemplate, SuccessfulLoginAttemptDto loginAttempt, String privateKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        BigInteger dhSecretInteger = new BigInteger(DH_SECRET_SIZE * 8, new SecureRandom());
        BigInteger dhBase = new BigInteger(Base64.getDecoder().decode(loginAttempt.getDhBase()));
        BigInteger dhModulus = new BigInteger(Base64.getDecoder().decode(loginAttempt.getDhModulus()));

        LoginConfirmationDto loginConfirmation = new LoginConfirmationDto();
        loginConfirmation.setSessionId(loginAttempt.getSessionId());
        loginConfirmation.setSignature(
            Base64.getEncoder().encodeToString(
                RsaUtils.sign(Base64.getDecoder().decode(loginAttempt.getChallenge()), privateKey)
            )
        );
        loginConfirmation.setDhKey(Base64.getEncoder().encodeToString(dhBase.modPow(dhSecretInteger, dhModulus).toByteArray()));

        try {
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(loginConfirmation), headers);
            SuccessfulLoginConfirmationDto responseDto = rest(restTemplate,
                HttpMethod.POST, LOGIN_CONFIRM_PREFIX, entity, SuccessfulLoginConfirmationDto.class
            ).getBody();

            SessionDto sessionDto = new SessionDto();
            sessionDto.sessionId = loginConfirmation.getSessionId();
            sessionDto.keepAliveMs = responseDto.getKeepaliveTimeout();
            sessionDto.dhSessionSecret = new BigInteger(Base64.getDecoder().decode(responseDto.getDhKey())).modPow(dhSecretInteger, dhModulus).toByteArray();

            return sessionDto;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private static <T> ResponseEntity<T> rest(RestTemplate restTemplate, HttpMethod method, String url, HttpEntity<?> entity, Class<T> type) {
        LOGGER.info().append("REST ").append(method).append(" ").append(url).commit();

        ResponseEntity<T> response = restTemplate.exchange(url, method, entity, type);
        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("REST QUERY GET " + url + " failed.");
        }

        LOGGER.info().append("REST ").append(method).append(" ").append(url).append(" done").commit();

        return response;
    }

}
