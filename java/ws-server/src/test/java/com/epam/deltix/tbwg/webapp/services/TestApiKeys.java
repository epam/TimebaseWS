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
import com.epam.deltix.tbwg.webapp.utils.ApiKeyUtils;
import com.epam.deltix.tbwg.webapp.utils.StompTestUtils;
import com.epam.deltix.tbwg.webapp.utils.StreamGenerator;
import com.epam.deltix.tbwg.webapp.utils.TimeBaseTestUtils;
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
import com.epam.deltix.tbwg.webapp.model.ws.system.StreamStatesMessageWrapper;
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
import org.springframework.http.*;
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
import java.util.UUID;
import java.util.concurrent.*;

import static java.util.concurrent.TimeUnit.*;
import static org.junit.Assert.*;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("testApiKeys")
@Ignore
public class TestApiKeys {

    private static final Log LOGGER = LogFactory.getLog(TestApiKeys.class);

    private static final String TEST_API_KEY = "TEST_API_KEY";
    private static final String TEST_API_SECRET = "TEST_API_SECRET";

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
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", String.class, TEST_API_KEY, TEST_API_SECRET
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
        assertNotNull(streams.getBody());
    }

    @Test
    public void testRestAPI2() {
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/test/select?symbols=TEST&offset=5&rows=2", String.class, TEST_API_KEY, TEST_API_SECRET
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
        assertNotNull(streams.getBody());
    }

    @Test
    public void testRestAPI2WithBody() {
        String body = "{\"streams\":[\"test\"]}";
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.POST, "/api/v0/select", body,
            String.class, TEST_API_KEY, TEST_API_SECRET
        );
        print(streams);
        assertEquals(HttpStatus.OK, streams.getStatusCode());
        assertNotNull(streams.getBody());
    }

    @Test
    public void testInvalidApiKey() {
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", String.class, TEST_API_KEY + "1", TEST_API_SECRET
        );
        print(streams);
        assertEquals(HttpStatus.UNAUTHORIZED, streams.getStatusCode());
    }

    @Test
    public void testInvalidApiSecret() {
        ResponseEntity<String> streams = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(),
            HttpMethod.GET, "/api/v0/streams", String.class, TEST_API_KEY, TEST_API_SECRET + "1"
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
            LOGGER.info().append("WS connection failed (OK)").append(t).commit();
        }
    }

    @Test
    public void testWebSocket() throws Exception {
        WebSocketStompClient stompClient = StompTestUtils.createWebSocketClient(new MappingJackson2MessageConverter());

        StompHeaders headers = new StompHeaders();
        final String payload = UUID.randomUUID().toString();
        final String data = "CONNECT" + "X-Deltix-Payload=" + payload + "&X-Deltix-ApiKey=" + TEST_API_KEY;
        final String signature = Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(data.getBytes(), TEST_API_SECRET.getBytes())
        );

        headers.put(ApiKeysAuthenticationService.API_KEY_HEADER, Arrays.asList(TEST_API_KEY));
        headers.put(ApiKeysAuthenticationService.SIGNATURE_HEADER, Arrays.asList(signature));
        headers.put(ApiKeysAuthenticationService.PAYLOAD_HEADER, Arrays.asList(payload));

        GLOBAL_WS_LATCH = new CountDownLatch(1);
        StompSession session = stompClient.connect(
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