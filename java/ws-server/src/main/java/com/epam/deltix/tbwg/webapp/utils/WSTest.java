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

import com.epam.deltix.spring.apikeys.ApiKeysAuthenticationService;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;

import javax.websocket.ContainerProvider;
import javax.websocket.WebSocketContainer;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;

import static java.util.concurrent.TimeUnit.SECONDS;

/**
 * Created by Alex Karpovich on 7/11/2018.
 */
public class WSTest {

    private static boolean toFile;
    private static PrintWriter writer;

    private static final String API_KEY = "TEST_API_KEY";
    private static final String API_SECRET = "TEST_API_SECRET";

    public static void main(String[] args) throws InterruptedException, IOException, ExecutionException, TimeoutException {
        Properties values = SimpleArgsParser.process(args);
        toFile = Boolean.parseBoolean(values.getProperty("-tofile", "False"));
        String url = values.getProperty("-url", "ws://localhost:8099/ws/v0/BINANCE/select");
        int clients = Integer.parseInt(values.getProperty("-clients", "1"));
        if (toFile) {
            writer = new PrintWriter(new FileWriter("ws_" + Integer.toString(clients) + ".txt"));
        }
        final Statistics stats = new Statistics();
        long start = System.currentTimeMillis();
        CountDownLatch latch = new CountDownLatch(clients);

        final String signature = ApiKeyUtils.buildSignature("GET", "/ws/v0/BINANCE/select", null, API_SECRET);

        WebSocketClient client = createWebSocketClient();

        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
//        headers.add(ApiKeysAuthenticationService.API_KEY_HEADER, API_KEY);
//        headers.add(ApiKeysAuthenticationService.SIGNATURE_HEADER, signature);
        // todo: request token by user and password
        headers.add("Authorization", "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NzA4NDQ3NTYsInVzZXJfbmFtZSI6ImFkbWluIiwiYXV0aG9yaXRpZXMiOlsiVEJfQUxMT1dfUkVBRCIsIlRCX0FMTE9XX1dSSVRFIl0sImp0aSI6InlST2pra0ZxRDVFbFRPRW9yY1oxQ0pKYmV5ayIsImNsaWVudF9pZCI6IndlYiIsInNjb3BlIjpbInRydXN0Il19.LT-qG_Ph9s8XmW7zgAXqRF1ufJkaYUrMACucejFByxLe_5ZQq7M9pbqopUpJ1ELTzy-0oXPG_CA-8uBUVD6VoNOFn0coDxBedO0qrkGL0oy7ozQVwYk4P7sgkvNUOoUAgPgvb9L0yF-QDLiDV3pjNeWC75zZ758jns_5HfsmZy4yd6DPjaFQYnb5m7fMxxJiJWdT-8NQzLImVWxks9Rx45g4V-rCaXoT1bZ4LS1ZIyCBD5RsAWkYwmsY4KviJuvLdjcG0eH0IfuYyDLDusyxO9xauowSYRAxNuNBQ0Dymlya9GXlc_X8yNITA8panxh1ZKJWUb7N7VsBjBfgPf_BnQ");
        for (int i = 0; i < clients; i++) {
            client.doHandshake(
                new Handler(stats, latch),
                headers,
                URI.create(url)
            ).get(100, SECONDS);
        }
        latch.await();
        stats.print(start);
        if (toFile) {
            writer.close();
        }
        System.exit(0);
    }

    private static WebSocketClient createWebSocketClient() {
        final WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxBinaryMessageBufferSize(512 * 1024);
        container.setDefaultMaxTextMessageBufferSize(512 * 1024);
        return new StandardWebSocketClient(container);
    }

    public final static class Statistics {
        final AtomicLong messages = new AtomicLong(0);
        final AtomicLong bytes = new AtomicLong(0);

        public void addBytes(int count) {
            bytes.addAndGet(count);
        }

        public void addMessages() {
            messages.incrementAndGet();
        }

        void print(long start) {
            double s = (System.currentTimeMillis() - start) * 0.001;
            long count = messages.get();
            System.out.printf(
                    "Overall: %d messages in %.3fs; speed: %.3f msg/s, %.3f Mib/sec\n",
                    count,
                    s,
                    count / s,
                    bytes.get() / s / 1024 / 1024
            );
            if (toFile) {
                writer.printf("Overall: %d messages in %.3fs; speed: %.3f msg/s, %.3f Mib/sec\n",
                        count,
                        s,
                        count / s,
                        bytes.get() / s / 1024 / 1024);
            }
        }
    }

    public static class Handler implements WebSocketHandler {

        private static long ID = 0;
        private long id;
        private final Statistics stats;
        private int count = 0;
        private long bytes = 0;
        private long start = 0;
        private final CountDownLatch latch;// = new CountDownLatch(1);

        public Handler(Statistics stats, CountDownLatch latch) {
            this.stats = stats;
            id = ID++;
            this.latch = latch;
        }

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            start = System.currentTimeMillis();
        }

        @Override
        public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
            stats.addMessages();
            stats.addBytes(message.getPayloadLength());
            count++;
            bytes += message.getPayloadLength();
        }

        @Override
        public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
            exception.printStackTrace();
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
            double s = (System.currentTimeMillis() - start) * 0.001;
            System.out.printf(
                    "Session[%d]: %d messages in %.3fs; speed: %.3f msg/s, %.3f Mib/sec\n",
                    id,
                    count,
                    s,
                    count / s,
                    bytes / s / 1024 / 1024
            );
            if (toFile) {
                writer.printf("Session[%d]: %d messages in %.3fs; speed: %.3f msg/s, %.3f Mib/sec\n",
                        id,
                        count,
                        s,
                        count / s,
                        bytes / s / 1024 / 1024);
            }
            latch.countDown();
        }

        @Override
        public boolean supportsPartialMessages() {
            return false;
        }
    }

}
