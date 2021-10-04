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

import io.netty.handler.codec.http.HttpHeaders;
import org.asynchttpclient.*;
import org.asynchttpclient.netty.request.NettyRequest;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicLong;

import static org.asynchttpclient.Dsl.asyncHttpClient;

public class ApiTest {

    private static boolean toFile;
    private static PrintWriter writer;

    public static void main(String[] args) throws InterruptedException, IOException {

        Properties values = SimpleArgsParser.process(args);
        toFile = Boolean.parseBoolean(values.getProperty("-tofile", "False"));
        String url = values.getProperty("-url", "http://localhost:8099/api/v0/speed.test.stream/select");
        int requests = Integer.parseInt(values.getProperty("-requests", "8"));
        if (toFile) {
            writer = new PrintWriter(new FileWriter("api_" + Integer.toString(requests) + ".txt"));
        }
        Stats stats = new Stats();
        AsyncHttpClient client = asyncHttpClient();
        CountDownLatch latch = new CountDownLatch(requests);
        long start = System.currentTimeMillis();
        for (int i = 0; i < requests; i++) {
            MyAsyncHandler handler = new MyAsyncHandler();
            ListenableFuture<Response> whenResponse = client.prepareGet(url).execute(handler);
            whenResponse.addListener(() -> {
                try {
                    Response response = whenResponse.get();
                    int length = response.getResponseBody().length();
                    double time = handler.getPerformanceTime();
                    double speed = length / time / 1024 / 1024;
                    System.out.printf("Response[%d]. status: %d; speed: %.10f Mib/sec\n",
                            handler.id, response.getStatusCode(), speed);
                    if (toFile) {
                        writer.printf("Response[%d]. status: %d; speed: %.10f Mib/sec\n",
                                handler.id, response.getStatusCode(), speed);
                    }
                    stats.addResponse();
                    stats.addLength(length);
                    latch.countDown();
                } catch (InterruptedException | ExecutionException exc) {
                    exc.printStackTrace();
                }
            }, null);

        }
        latch.await();
        stats.printStats(start);
        if (toFile) {
            writer.close();
        }
        System.exit(0);
    }

    public static class Stats {
        final AtomicLong responses = new AtomicLong(0);
        final AtomicLong bytes = new AtomicLong(0);

        public void addResponse() {
            responses.incrementAndGet();
        }

        public void addLength(long length) {
            bytes.addAndGet(length);
        }

        public void printStats(long start) {
            double s = (System.currentTimeMillis() - start) * 0.001;
            System.out.printf(
                    "Overall: %d responses in %.3fs; speed: %.3f msg/s, %.3f Mib/sec\n",
                    responses.get(),
                    s,
                    responses.get() / s,
                    bytes.get() / s / 1024 / 1024
            );
            if (toFile) {
                writer.printf(
                        "Overall: %d responses in %.3fs; speed: %.3f msg/s, %.3f Mib/sec\n",
                        responses.get(),
                        s,
                        responses.get() / s,
                        bytes.get() / s / 1024 / 1024
                );
            }
        }
    }

    public static class MyAsyncHandler implements AsyncHandler<Response> {

        private long startTime = -1;
        private long endTime = -1;
        private static long ID = 0;
        private long id;
        private final Response.ResponseBuilder builder =
                new Response.ResponseBuilder();

        public MyAsyncHandler() {
            id = ID++;
        }

        public long getPerformanceTime() {
            return endTime - startTime;
        }

        @Override
        public State onStatusReceived(HttpResponseStatus responseStatus) {
            builder.accumulate(responseStatus);
            return State.CONTINUE;
        }

        @Override
        public State onHeadersReceived(HttpHeaders headers) {
            builder.accumulate(headers);
            return State.CONTINUE;
        }

        @Override
        public State onBodyPartReceived(HttpResponseBodyPart bodyPart) {
            builder.accumulate(bodyPart);
            return State.CONTINUE;
        }

        @Override
        public void onThrowable(Throwable t) {

        }

        @Override
        public Response onCompleted() {
            endTime = System.currentTimeMillis();
            return builder.build();
        }

        @Override
        public void onRequestSend(NettyRequest request) {
            startTime = System.currentTimeMillis();
        }
    }

}
