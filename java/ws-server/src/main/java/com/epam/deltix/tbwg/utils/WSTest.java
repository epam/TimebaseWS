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
package com.epam.deltix.tbwg.utils;

import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.ws.WebSocket;
import org.asynchttpclient.ws.WebSocketListener;
import org.asynchttpclient.ws.WebSocketUpgradeHandler;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicLong;

import static org.asynchttpclient.Dsl.asyncHttpClient;

/**
 * Created by Alex Karpovich on 7/11/2018.
 */
public class WSTest {

    private static boolean toFile;
    private static PrintWriter writer;

    public static void main(String[] args) throws InterruptedException, IOException, ExecutionException {
        Properties values = SimpleArgsParser.process(args);
        toFile = Boolean.parseBoolean(values.getProperty("-tofile", "False"));
        String url = values.getProperty("-url", "ws://localhost:8099/ws/v0/speed.test.stream.small/select");
        int clients = Integer.parseInt(values.getProperty("-clients", "5"));
        if (toFile) {
            writer = new PrintWriter(new FileWriter("ws_" + Integer.toString(clients) + ".txt"));
        }
        final Statistics stats = new Statistics();
        long start = System.currentTimeMillis();
        AsyncHttpClient client = asyncHttpClient();
        CountDownLatch latch = new CountDownLatch(clients);
        for (int i = 0; i < clients; i++) {
                client.prepareGet(url)
                        .execute(new WebSocketUpgradeHandler.Builder()
                                .addWebSocketListener(new WebSocketClient(stats, latch))
                                .build()).toCompletableFuture().join();
        }
        latch.await();
        stats.print(start);
        if (toFile) {
            writer.close();
        }
        System.exit(0);
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

    public static class WebSocketClient implements WebSocketListener {

        private static long ID = 0;
        private long id;
        private final Statistics stats;
        private int count = 0;
        private long bytes = 0;
        private long start = 0;
        private final CountDownLatch latch;// = new CountDownLatch(1);

        public WebSocketClient(Statistics stats, CountDownLatch latch) {
            this.stats = stats;
            id = ID++;
            this.latch = latch;
        }

        @Override
        public void onOpen(WebSocket websocket) {
            start = System.currentTimeMillis();
        }

        @Override
        public void onClose(WebSocket websocket, int code, String reason) {
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
        public void onError(Throwable t) {

        }

        @Override
        public void onTextFrame(String payload, boolean finalFragment, int rsv) {
            stats.addMessages();
            stats.addBytes(payload.length());
            count++;
            bytes += payload.length();
        }
    }


}
