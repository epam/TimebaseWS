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

import com.epam.deltix.spring.apikeys.ApiKeysAuthenticationService;
import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.Request;
import org.asynchttpclient.RequestBuilder;
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

    private static final String API_KEY = "TEST_API_KEY";
    private static final String API_SECRET = "TEST_API_SECRET";

    public static void main(String[] args) throws InterruptedException, IOException, ExecutionException {
        Properties values = SimpleArgsParser.process(args);
        toFile = Boolean.parseBoolean(values.getProperty("-tofile", "False"));
        String url = values.getProperty("-url", "ws://localhost:8099/ws/v0/BINANCE/select");
        int clients = Integer.parseInt(values.getProperty("-clients", "1"));
        if (toFile) {
            writer = new PrintWriter(new FileWriter("ws_" + Integer.toString(clients) + ".txt"));
        }
        final Statistics stats = new Statistics();
        long start = System.currentTimeMillis();
        AsyncHttpClient client = asyncHttpClient();
        CountDownLatch latch = new CountDownLatch(clients);

        final String signature = ApiKeyUtils.buildSignature("GET", "/ws/v0/BINANCE/select", null, API_SECRET);

        Request request = new RequestBuilder()
            .setUrl(url)
            .setMethod("GET")
//            .addHeader("Authorization", "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MzU0OTYzNjIsInVzZXJfbmFtZSI6ImFkbWluIiwiYXV0aG9yaXRpZXMiOlsiVEJfQUxMT1dfUkVBRCIsIlRCX0FMTE9XX1dSSVRFIl0sImp0aSI6ImJkNGY2NmM5LWUwM2YtNDVhYS1hNDE5LWFmNDVhMjA2M2RmYyIsImNsaWVudF9pZCI6IndlYiIsInNjb3BlIjpbInRydXN0Il19.b_hbqgGsbt3vN6pWeUPh97SdXTuYyf5xS5D6spX0bEAi1U31PLEZ4OL7O3WNgJ40xmjLf9hFhsHBkfU5iZBcpNREfhRYeKFMZr_k4ePUypx6FYeosUCEKCHXQpcDLv1rNyOC3EjVcST3iwQky9RnsX-5mRGQmJWAC692-yd1cLKvKMbK29TEyfSgsUzniQr8qaBFmAXzh4MzmK0ldl41Ac66TPApyt6Xl6iVrQL_LP4jdE9AB_L9mZPWltUT_kcs-u0w6qrjc9q7hE1b5pPDFL3f7wCs2-n5tKpNwE4_vm-_Xe7-f8jSK00X5WOVsBE25RhfHyIgjs0_yhL4rB0lFG8HMP7vnKcUm1z2B7bPE9ckTowx2QNpVXMQlYSf3OqWfOt44ln3kXY-roW1XyY1hiHDAYkGqCI9iDr_iJ6TcMILz9-GWCQ4C87zOFrQlpJ6VwlSWLxAsgtweSEbWLvXLyx-TB_5pUcnLmzTRz4Rm0mNj5xWFcX1tT44qYrKUsUC0i2HgFy-j0SWiKE1Q0WrMk_GYGg10XMBL_w4xrAl3ZIalWg-o3lYNEUNGIMU8TAe_RxDMKFqiCbC2ImQK__TJLdk78zOvlSVmeVmIG3rRqtPvpxOn15m0eScN3MUvVdsDJnmgjHJunPDiLV5UiRi1BlEiKhygm9_06JwaC_xqE4")
            .setHeader(ApiKeysAuthenticationService.API_KEY_HEADER, API_KEY)
            .setHeader(ApiKeysAuthenticationService.SIGNATURE_HEADER, signature)
            .build();
        for (int i = 0; i < clients; i++) {
                client.prepareRequest(request)
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
            t.printStackTrace();
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
