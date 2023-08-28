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

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.utils.HmacUtils;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

public class ApiKeyUtils {

    private static final Log LOGGER = LogFactory.getLog(ApiKeyUtils.class);

    public static <T> ResponseEntity<T> signedRest(RestTemplate restTemplate,
                                                   HttpMethod method, String path,
                                                   Class<T> type,
                                                   String apiKey, String apiSecret)
    {
        return signedRest(restTemplate, method, path, null, type, apiKey, apiSecret);
    }

    public static <T> ResponseEntity<T> signedRest(RestTemplate restTemplate,
                                                   HttpMethod method, String path, String body,
                                                   Class<T> type,
                                                   String apiKey, String apiSecret)
    {
        LOGGER.info().append("REST ").append(method).append(" ").append(path).commit();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Deltix-ApiKey", apiKey);
        headers.set("X-Deltix-Signature", buildSignature(method.name(), path, body, apiSecret));
        if (body != null) {
            headers.set("Content-Type", "application/json");
        }

        HttpEntity entity = (body != null ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers));
        ResponseEntity<T> response = restTemplate.exchange(path, method, entity, type);

        LOGGER.info().append("REST ").append(method).append(" ").append(path).append(" done").commit();

        return response;
    }

    public static <T> ResponseEntity<T> signedRest(RestTemplate restTemplate,
                                                    HttpMethod method, String path, String nonce,
                                                    Class<T> type,
                                                    SessionLoginUtils.SessionDto session)
    {
        return signedRest(restTemplate, method, path, null, nonce, type, session);
    }

    public static <T> ResponseEntity<T> signedRest(RestTemplate restTemplate,
                                                    HttpMethod method, String path, String body, String nonce,
                                                    Class<T> type,
                                                   SessionLoginUtils.SessionDto session)
    {
        LOGGER.info().append("REST ").append(method).append(" ").append(path).commit();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Deltix-Nonce", nonce);
        headers.set("X-Deltix-Session-Id", session.sessionId);
        headers.set("X-Deltix-Signature", buildSignature(method.name(), path, body, nonce, session));
        if (body != null) {
            headers.set("Content-Type", "application/json");
        }

        HttpEntity entity = (body != null ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers));
        ResponseEntity<T> response = restTemplate.exchange(path, method, entity, type);

        LOGGER.info().append("REST ").append(method).append(" ").append(path).append(" done").commit();

        return response;
    }

    static String buildSignature(String method, String fullUrl, String body, String nonce, SessionLoginUtils.SessionDto session) {
        // BASE64(HMAC_SHA384(payload, session_secret))
        return Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(
                buildPayload(method, fullUrl, body, nonce, session.sessionId).getBytes(), session.dhSessionSecret
            )
        );
    }

    static String buildSignature(String method, String fullUrl, String body, String apiSecret) {
        // BASE64(HMAC_SHA384(payload, session_secret))
        return Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(
                buildPayload(method, fullUrl, body).getBytes(), apiSecret.getBytes()
            )
        );
    }

    static String buildPayload(String method, String fullUrl, String body) {
        return buildPayload(method, fullUrl, body, null, null);
    }

    static String buildPayload(String method, String fullUrl, String body, String nonce, String sessionId) {
        // method+path+request_parameters+request_headers+request_body
        String url = fullUrl;
        String requestParameters = "";
        int index = fullUrl.indexOf('?');
        if (index >= 0) {
            url = fullUrl.substring(0, index);
            requestParameters = buildParameters(fullUrl.substring(index + 1));
        }

        String payload = method.toUpperCase() + url.toLowerCase() + requestParameters;
        if (nonce != null && sessionId != null) {
            payload += "X-Deltix-Nonce=" + nonce + "&X-Deltix-Session-Id=" + sessionId;
        }

        if (body != null) {
            payload += body;
        }

        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug().append("Payload: ").append(payload).commit();
        }

        return payload;
    }

    private static String buildParameters(String query) {
        StringBuilder payload = new StringBuilder();

        Map<String, String> parameters = parseParameters(query);
        List<String> paramKeys = new ArrayList<>(parameters.keySet());
        paramKeys.sort(Comparator.naturalOrder());
        for (int i = 0; i < paramKeys.size(); i++) {
            String param = paramKeys.get(i);
            String value = parameters.get(param);
            payload.append(param.toLowerCase()).append("=").append(value);
            if (i != paramKeys.size() - 1) {
                payload.append("&");
            }
        }

        return payload.toString();
    }

    private static Map<String, String> parseParameters(String query) {
        if (query == null) {
            return new HashMap<>();
        }

        Map<String, String> parameters = new HashMap<>();
        String[] params = query.split("&");
        for (String param : params) {
            String name = param.split("=")[0];
            String value = param.split("=")[1];
            parameters.put(name, value);
        }

        return parameters;
    }
}
