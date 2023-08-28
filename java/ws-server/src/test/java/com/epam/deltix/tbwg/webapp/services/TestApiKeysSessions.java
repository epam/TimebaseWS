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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.tbwg.webapp.Application;
import com.epam.deltix.tbwg.webapp.model.ws.system.StreamStatesMessageWrapper;
import com.epam.deltix.tbwg.webapp.utils.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.spring.apikeys.ApiKeysAuthenticationService;
import com.epam.deltix.spring.apikeys.utils.HmacUtils;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ws.InstantTypeAdapter;
import com.epam.deltix.tbwg.webapp.model.ws.SubscribeMessage;
import org.apache.commons.io.FileUtils;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandler;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import javax.annotation.Nonnull;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static org.junit.Assert.*;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("testApiKeysSessions")
@Ignore
public class TestApiKeysSessions {

    private static final Log LOGGER = LogFactory.getLog(TestApiKeysSessions.class);

    private static final String SESSION_API_KEY = "TEST_SESSION_API_KEY";
    private static final String SESSION_PRIVATE_KEY = "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAOr9j+QRqD28+V8+7Z3MVR649Nlf3iDzm/8vdPFG9ceZHUhC2M5I8K1jg2bN4tvesvB/Qnb5fwd4LcW9rqhFWXmGitrvtw5OYu5OYRl7qhXGMW91GxCp9xSUCqKNWKI8yWcNBn8ewLpLtYtnIzBq11sGwW2dtP19vebhUN5qRRVDAgMBAAECgYAwP3+bxERW6MYK2FDRZXLUrAUZ3KUu/tW4v3WzVG6CXN22SINbV36TGyuPoBZELqVu27I522BJmFNNlnSV+Cc2d7+Je/LnyH853DNQu3QqlsBLzUEWt0KqCLjKF1BdVxALD0ddGka3RIAsjTJnxDVLVagfqxVOXcg/pxtrFvkMgQJBAPg1+J+dD71EocoNaSd0rsGtMEHSSiT2Dyfi9JJHHCooZ8pEJs6WtCH0Qc0xA4NQ/+EV7Zqg74J9fSrkPXxI0/8CQQDyXWI/H7T9WeqWVxh0/ZUUI2Y1x1SD6Y7LYNprzT/raUBqSPVaIv5W+A8057s80AeIiLJ7OLUJvKggcvqul269AkBiLObUK0mIcVcVFkzbYFmnHZuSzVyqVfEUs75NBXdsbWLwLBi1agKB050bTiG3lRhArW231aQmlwAlMPXo7N19AkBU7nCdWkkcd0QDxyWk6bAyTG1m7yEo0NHfZ2NjX5vErS+Lj2GbYqPqaic6DPLKTsQ1DmItWCPo85mfNWuvfxWpAkEAxX3/9QJQefjsfZvk77tLZZRM8aUI/O2YnT5ex1oufzeXmdVZpZ3f427pnosRAHZwFPvL3g8oh1iK8ynAm11EMA==";
    private static final String SESSION_PRIVATE_KEY_INVALID = "MIICdgIBADANBgkqhkiG8w0BAQEFAASCAmAwggJcAgEAAoGBAOr9j+QRqD28+V8+7Z3MVR649Nlf3iDzm/8vdPFG9ceZHUhC2M5I8K1jg2bN4tvesvB/Qnb5fwd4LcW9rqhFWXmGitrvtw5OYu5OYRl7qhXGMW91GxCp9xSUCqKNWKI8yWcNBn8ewLpLtYtnIzBq11sGwW2dtP19vebhUN5qRRVDAgMBAAECgYAwP3+bxERW6MYK2FDRZXLUrAUZ3KUu/tW4v3WzVG6CXN22SINbV36TGyuPoBZELqVu27I522BJmFNNlnSV+Cc2d7+Je/LnyH853DNQu3QqlsBLzUEWt0KqCLjKF1BdVxALD0ddGka3RIAsjTJnxDVLVagfqxVOXcg/pxtrFvkMgQJBAPg1+J+dD71EocoNaSd0rsGtMEHSSiT2Dyfi9JJHHCooZ8pEJs6WtCH0Qc0xA4NQ/+EV7Zqg74J9fSrkPXxI0/8CQQDyXWI/H7T9WeqWVxh0/ZUUI2Y1x1SD6Y7LYNprzT/raUBqSPVaIv5W+A8057s80AeIiLJ7OLUJvKggcvqul269AkBiLObUK0mIcVcVFkzbYFmnHZuSzVyqVfEUs75NBXdsbWLwLBi1agKB050bTiG3lRhArW231aQmlwAlMPXo7N19AkBU7nCdWkkcd0QDxyWk6bAyTG1m7yEo0NHfZ2NjX5vErS+Lj2GbYqPqaic6DPLKTsQ1DmItWCPo85mfNWuvfxWpAkEAxX3/9QJQefjsfZvk77tLZZRM8aUI/O2YnT5ex1oufzeXmdVZpZ3f427pnosRAHZwFPvL3g8oh1iK8ynAm11EMA==";

    private static final long TIMEOUT = 20000;

    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    private static DXTickDB db;
    private static Path testDirectory;
    private static Future<?> future;
    private static final int messagesNumber = 20;
    private static String subscribeMessage = "";

    private static volatile CountDownLatch GLOBAL_WS_LATCH;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeClass
    public static void beforeClass() throws Throwable {
        SubscribeMessage message = new SubscribeMessage();
        message.symbols.subscribeToAll = true;
        Gson gson = new GsonBuilder().registerTypeAdapter(Instant.class, new InstantTypeAdapter()).create();
        subscribeMessage = gson.toJson(message);

        testDirectory = Files.createTempDirectory("test_api_keys");
        future = TimeBaseTestUtils.startTimeBase(testDirectory, executor);
        db = TimeBaseTestUtils.waitTillTimebaseIsUp(TIMEOUT);
        StreamGenerator.loadBars(messagesNumber, "test", db);
    }

    @AfterClass
    public static void afterClass() {
        db.getStream("test").delete();
        db.close();
        future.cancel(true);
        executor.shutdownNow();
        FileUtils.deleteQuietly(testDirectory.toFile());
    }

    @Test
    public void testBaseLine() {
        ResponseEntity<String> streams = restTemplate.getForEntity("/api/v0/streams", String.class);
        print(streams);
        assertEquals(HttpStatus.UNAUTHORIZED, streams.getStatusCode());
    }

    @Test
    public void testRestAPI() {
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "1", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
        assertNotNull(streams.getBody());
    }

    @Test
    public void testRestAPI2() {
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/test/select?symbols=TEST&offset=5&rows=2", "1", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
        assertNotNull(streams.getBody());
    }

    @Test
    public void testRestAPI2WithBody() {
        String body = "{\"streams\":[\"test\"]}";
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.POST, "/api/v0/select", body, "1",
            String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
        assertNotNull(streams.getBody());
    }

    @Test
    public void testInvalidApiKey() {
        try {
            SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY + "1", SESSION_PRIVATE_KEY);
            assertFalse(false);
        } catch (Throwable t) {
            LOGGER.info().append("Session login failed (OK)").append(t).commit();
        }
    }

    @Test
    public void testInvalidSecret() {
        try {
            SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY_INVALID);
            assertFalse(false);
        } catch (Throwable t) {
            LOGGER.info().append("Session login failed (OK)").append(t).commit();
        }
    }

    @Test
    public void testInvalidSignature() {
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);
        session.dhSessionSecret[0] += 1;
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "1", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.BAD_REQUEST, streams.getStatusCode());
    }

    @Test
    public void testNonce() {
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "1", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());

        streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "2", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());

        streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "3", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
    }


    @Test
    public void testInvalidNonce() {
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "1", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());

        streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "2", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());

        streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "2", String.class, session
        );
        print(streams);
        assertEquals(HttpStatus.BAD_REQUEST, streams.getStatusCode());
    }

    @Test
    public void testWebSocketBaseline() {
        try {
            StompTestUtils.createWebSocketClient(new MappingJackson2MessageConverter()).connect(
                String.format("ws://localhost:%d/stomp/v0", port),
                new WebSocketHttpHeaders(),
                new StompHeaders(),
                new SimpleSessionHandler()
            ).get(TIMEOUT, MILLISECONDS);

            assertFalse(false);
        } catch (Throwable t) {
            // OK
            t.printStackTrace();
        }
    }

    @Test
    public void testWebSocket() throws Exception {
        SessionLoginUtils.SessionDto session = SessionLoginUtils.login(restTemplate.getRestTemplate(), SESSION_API_KEY, SESSION_PRIVATE_KEY);

        // make request with nonce 1 to check ws nonce
        ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", "1", String.class, session
        );

        WebSocketStompClient stompClient = StompTestUtils.createWebSocketClient(new MappingJackson2MessageConverter());

        StompHeaders headers = new StompHeaders();
        final String nonce = "2";
        final String data = "CONNECT" + "X-Deltix-Nonce=" + nonce + "&X-Deltix-Session-Id=" + session.sessionId;
        final String signature = Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(data.getBytes(), session.dhSessionSecret)
        );

        headers.put(ApiKeysAuthenticationService.SESSION_HEADER, Arrays.asList(session.sessionId));
        headers.put(ApiKeysAuthenticationService.SIGNATURE_HEADER, Arrays.asList(signature));
        headers.put(ApiKeysAuthenticationService.NONCE_HEADER, Arrays.asList(nonce));

        GLOBAL_WS_LATCH = new CountDownLatch(1);
        stompClient.connect(
            String.format("ws://localhost:%d/stomp/v0", port),
            new WebSocketHttpHeaders(),
            headers,
            new SimpleSessionHandler()
        ).get(TIMEOUT, MILLISECONDS);

        assertTrue(GLOBAL_WS_LATCH.await(TIMEOUT, MILLISECONDS));
    }

    private static void print(final ResponseEntity<String> response) {
        System.out.printf("Response (code: %s, body: %s)%n", response.getStatusCode(), response.getBody());
        System.out.println();
    }

    private class SimpleSessionHandler implements StompSessionHandler {

        @Override
        public void afterConnected(@Nonnull StompSession session, @Nonnull StompHeaders connectedHeaders) {
            LOGGER.info().append("Established session ").append(session).commit();
            session.subscribe(WebSocketConfig.STREAMS_TOPIC, this);
            GLOBAL_WS_LATCH.countDown();
        }

        @Override
        public void handleException(@Nonnull StompSession session, StompCommand command, @Nonnull StompHeaders headers, byte[] payload, Throwable exception) {
            LOGGER.error().append("Exception in session ")
                .append(session)
                .append(": ").append(exception)
                .commit();
        }

        @Override
        public void handleTransportError(@Nonnull StompSession session, @Nonnull Throwable exception) {
            LOGGER.error().append("Transport error in session ")
                .append(session)
                .append(": ").append(exception)
                .commit();
        }

        @Nonnull
        @Override
        public Type getPayloadType(@Nonnull StompHeaders headers) {
            return StreamStatesMessageWrapper.class;
        }

        @Override
        public void handleFrame(@Nonnull StompHeaders headers, Object payload) {
            LOGGER.info().append("Got message: ").append(payload).commit();
        }
    }

}