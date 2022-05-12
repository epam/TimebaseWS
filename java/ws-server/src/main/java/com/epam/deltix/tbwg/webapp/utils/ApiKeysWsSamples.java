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

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.ApiKeysAuthenticationService;
import com.epam.deltix.spring.apikeys.utils.HmacUtils;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandler;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import javax.websocket.ContainerProvider;
import javax.websocket.WebSocketContainer;
import java.lang.reflect.Type;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;

import static java.util.concurrent.TimeUnit.MINUTES;
import static java.util.concurrent.TimeUnit.SECONDS;

public class ApiKeysWsSamples implements StompSessionHandler {

    private static final Log LOG = LogFactory.getLog(ApiKeysWsSamples.class);

    private static final String API_KEY = "TEST_API_KEY";
    private static final String API_SECRET = "TEST_API_SECRET";

    public static final String TB_URL = "ws://localhost:8099";

    private static final DateTimeFormatter TIMESTAMP_ISO_8601 = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss.SSS'Z'");
    private static final ZoneId UTC = ZoneId.of("UTC");

    private static CountDownLatch latch = new CountDownLatch(9);

    public static void main(final String[] args) throws Exception {
        WebSocketStompClient stompClient = createWebSocketClient(new MappingJackson2MessageConverter());

        StompHeaders headers = new StompHeaders();
        final String payload = randomString();
        final String data = "CONNECT" + "X-Deltix-Payload=" + payload + "&X-Deltix-ApiKey=" + API_KEY;
        final String signature = Base64.getEncoder().encodeToString(
            HmacUtils.hashHmacSha384(data.getBytes(), API_SECRET.getBytes())
        );

        headers.put(ApiKeysAuthenticationService.API_KEY_HEADER, Arrays.asList(API_KEY));
        headers.put(ApiKeysAuthenticationService.SIGNATURE_HEADER, Arrays.asList(signature));
        headers.put(ApiKeysAuthenticationService.PAYLOAD_HEADER, Arrays.asList(payload));

        StompSession session = stompClient.connect(
            TB_URL + "/stomp/v0",
            new WebSocketHttpHeaders(),
            headers,
            new ApiKeysWsSamples()
        ).get(100, SECONDS);

        latch.await(10, MINUTES);
    }

    private static String randomString() {
        return UUID.randomUUID().toString();
    }

    private static String timestampISO8601(final long timestamp) {
        return Instant.ofEpochMilli(timestamp)
            .atZone(UTC)
            .format(TIMESTAMP_ISO_8601);
    }

    @Override
    public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
        LOG.info().append("Established session ").append(session).commit();
        session.subscribe("/topic/streams", this);
    }

    @Override
    public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
        LOG.error().append("Exception in session ")
            .append(session)
            .append(": ").append(exception)
            .commit();
    }

    @Override
    public void handleTransportError(StompSession session, Throwable exception) {
        LOG.error().append("Transport error in session ")
            .append(session)
            .append(": ").append(exception)
            .commit();
    }

    @Override
    public Type getPayloadType(StompHeaders headers) {
        return Map.class;
    }

    @Override
    public void handleFrame(StompHeaders headers, Object payload) {
        LOG.info().append("Got message: ").append(payload).commit();
        latch.countDown();
    }

    private static WebSocketStompClient createWebSocketClient(MessageConverter converter) {
        final WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxBinaryMessageBufferSize(512 * 1024);
        container.setDefaultMaxTextMessageBufferSize(512 * 1024);
        final WebSocketClient webSocketClient = new StandardWebSocketClient(container);

        final WebSocketStompClient client = new WebSocketStompClient(webSocketClient);
        client.setMessageConverter(converter);
        client.setInboundMessageSizeLimit(512 * 1024);

        return client;
    }

}
