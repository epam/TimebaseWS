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
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.converter.SimpleMessageConverter;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;

import static java.util.concurrent.TimeUnit.MINUTES;
import static java.util.concurrent.TimeUnit.SECONDS;


public class WsMonitorSample implements StompSessionHandler {

    private static final Log LOG = LogFactory.getLog(WsMonitorSample.class);

    public static final String TB_URL = "ws://localhost:8099";

    private static CountDownLatch latch = new CountDownLatch(10000);

    private static StompSession.Subscription subscription;

    private final static AtomicLong messages = new AtomicLong();

    private final static HashMap<String, AtomicLong> subscriptions = new HashMap<>();

    private final static AtomicLong subId = new AtomicLong();

    public static void main(final String[] args) throws Exception {

        for (int i = 0; i < 30; ++i) {
            WebSocketStompClient stompClient = createWebSocketClient(new SimpleMessageConverter());
            StompSession session = stompClient.connect(
                TB_URL + "/stomp/v0",
                new WebSocketHttpHeaders(),
                new StompHeaders(),
                new WsMonitorSample()
            ).get(100, SECONDS);
        }

        latch.await(10, MINUTES);
    }

    @Override
    public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
        LOG.info().append("Established session ").append(session).commit();

//        for (int i = 0; i < 10; ++i) {
            StompHeaders headers = new StompHeaders();
        /*
        SUBSCRIBE
        fromTimestamp:2022-08-08T12:51:58.241Z
        ack:auto
        id:sub-3
        destination:/user/topic/monitor/BINANCE
         */
            headers.put("destination", Arrays.asList("/user/topic/monitor/coinbase"));
            headers.put("fromTimestamp", Arrays.asList(Instant.now().toString()));
            headers.put("id", Arrays.asList("sub-" + subId.incrementAndGet()));

            subscription = session.subscribe(headers, this);
//        }
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
        return byte[].class;
    }

    @Override
    public void handleFrame(StompHeaders headers, Object payload) {
        String s = new String((byte[]) payload);
//        LOG.info().append("Got message: ").append(s).commit();

        String sub = headers.get("subscription").get(0);
        int size = subscriptions.size();
        subscriptions.computeIfAbsent(sub, k -> new AtomicLong());
        if (size != subscriptions.size()) {
            System.out.println(this + " Subscriptions count: " + size);
        }

        long count = subscriptions.get(sub).incrementAndGet();
        if (count <= 2) {
            System.out.println(this + " !!! received " + count);
        }
        if (count == 10) {
            System.out.println(this + " !!! Received " + count);
            latch.countDown();
            long subscribers = messages.incrementAndGet();
            System.out.println("!!!: " + subscribers + " got 10 messages");
        }

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

