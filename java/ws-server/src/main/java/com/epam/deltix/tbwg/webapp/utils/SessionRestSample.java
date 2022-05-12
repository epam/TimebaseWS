/*
 * Copyright 2021 EPAM Systems, Inc
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
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.utils.HmacUtils;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

public class SessionRestSample {

    private static final Log LOGGER = LogFactory.getLog(SessionRestSample.class);

    private static final String API_KEY = "TEST_API_KEY";
    private static final String API_SECRET = "TEST_API_SECRET";
    private static final String SESSION_API_KEY = "TEST_SESSION_API_KEY";
    private static final String SESSION_PRIVATE_KEY = "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAOr9j+QRqD28+V8+7Z3MVR649Nlf3iDzm/8vdPFG9ceZHUhC2M5I8K1jg2bN4tvesvB/Qnb5fwd4LcW9rqhFWXmGitrvtw5OYu5OYRl7qhXGMW91GxCp9xSUCqKNWKI8yWcNBn8ewLpLtYtnIzBq11sGwW2dtP19vebhUN5qRRVDAgMBAAECgYAwP3+bxERW6MYK2FDRZXLUrAUZ3KUu/tW4v3WzVG6CXN22SINbV36TGyuPoBZELqVu27I522BJmFNNlnSV+Cc2d7+Je/LnyH853DNQu3QqlsBLzUEWt0KqCLjKF1BdVxALD0ddGka3RIAsjTJnxDVLVagfqxVOXcg/pxtrFvkMgQJBAPg1+J+dD71EocoNaSd0rsGtMEHSSiT2Dyfi9JJHHCooZ8pEJs6WtCH0Qc0xA4NQ/+EV7Zqg74J9fSrkPXxI0/8CQQDyXWI/H7T9WeqWVxh0/ZUUI2Y1x1SD6Y7LYNprzT/raUBqSPVaIv5W+A8057s80AeIiLJ7OLUJvKggcvqul269AkBiLObUK0mIcVcVFkzbYFmnHZuSzVyqVfEUs75NBXdsbWLwLBi1agKB050bTiG3lRhArW231aQmlwAlMPXo7N19AkBU7nCdWkkcd0QDxyWk6bAyTG1m7yEo0NHfZ2NjX5vErS+Lj2GbYqPqaic6DPLKTsQ1DmItWCPo85mfNWuvfxWpAkEAxX3/9QJQefjsfZvk77tLZZRM8aUI/O2YnT5ex1oufzeXmdVZpZ3f427pnosRAHZwFPvL3g8oh1iK8ynAm11EMA==";

    public static final String TB_URL = "http://localhost:8099";

    private final static RestTemplate client = new RestTemplate();
    private final static AtomicLong nonceGenerator = new AtomicLong(System.currentTimeMillis());

    public static void main(String[] args) throws JsonProcessingException {
//        getStreams();
//        getStreamData();
        SessionLoginSample.SessionDto session = SessionLoginSample.login(TB_URL, SESSION_API_KEY, SESSION_PRIVATE_KEY);
        getStreams(session);
//        getStreams(session);
    }

    private static void getStreams() {
        ResponseEntity<String> response = signedRest(
            HttpMethod.GET, TB_URL, "/api/v0/streams", String.class, API_KEY, API_SECRET
        );
        print(response);
    }

    private static void getStreams(SessionLoginSample.SessionDto session) {
        ResponseEntity<String> response = signedRest(
            HttpMethod.GET, TB_URL, "/api/v0/streams", String.class, session
        );
        print(response);
    }

    private static void getStreamData() throws JsonProcessingException {
        ResponseEntity<String> response = signedRest(
            HttpMethod.GET, TB_URL, "/api/v0/bars1min/GOOG/select?reverse=false&types=deltix.timebase.api.messages.BarMessage&offset=0",
            String.class, API_KEY, API_SECRET
        );
        print(response);
    }

    private static <T> ResponseEntity<T> signedRest(HttpMethod method, String url, String path, Class<T> type, String apiKey, String apiSecret)
    {
        String fullUrl = url + path;

        LOGGER.info().append("REST ").append(method).append(" ").append(fullUrl).commit();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Deltix-ApiKey", apiKey);
        headers.set("X-Deltix-Signature", buildSignature(method.name(), path, apiSecret));

        ResponseEntity<T> response = client.exchange(fullUrl, method, new HttpEntity<>(headers), type);
        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("REST QUERY GET " + fullUrl + " failed.");
        }

        LOGGER.info().append("REST ").append(method).append(" ").append(fullUrl).append(" done").commit();

        return response;
    }

    private static <T> ResponseEntity<T> signedRest(HttpMethod method, String url, String path, Class<T> type, SessionLoginSample.SessionDto session) {
        String fullUrl = url + path;

        LOGGER.info().append("REST ").append(method).append(" ").append(fullUrl).commit();

        String nonce = String.valueOf(nonceGenerator.incrementAndGet());

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Deltix-Nonce", nonce);
        headers.set("X-Deltix-Session-Id", session.sessionId);
        headers.set("X-Deltix-Signature", buildSignature(method.name(), path, nonce, session));

        ResponseEntity<T> response = client.exchange(fullUrl, method, new HttpEntity<>(headers), type);
        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("REST QUERY GET " + fullUrl + " failed.");
        }

        LOGGER.info().append("REST ").append(method).append(" ").append(fullUrl).append(" done").commit();

        return response;
    }

    private static String buildSignature(String method, String fullUrl, String nonce, SessionLoginSample.SessionDto session) {
        // BASE64(HMAC_SHA384(payload, session_secret))
        return Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(
                buildPayload(method, fullUrl, nonce, session.sessionId).getBytes(), session.dhSessionSecret
            )
        );
    }

    private static String buildSignature(String method, String fullUrl, String apiSecret) {
        // BASE64(HMAC_SHA384(payload, session_secret))
        return Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(
                buildPayload(method, fullUrl).getBytes(), apiSecret.getBytes()
            )
        );
    }

    private static String buildPayload(String method, String fullUrl) {
        return buildPayload(method, fullUrl, null, null);
    }

    private static String buildPayload(String method, String fullUrl, String nonce, String sessionId) {
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

    private static void print(final ResponseEntity<String> response) {
        System.out.printf("Response (code: %s, body: %s)%n", response.getStatusCode(), response.getBody());
        System.out.println();
    }
}
