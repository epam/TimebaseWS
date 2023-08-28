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
import com.epam.deltix.tbwg.webapp.utils.StompTestUtils;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.timebase.SystemMessagesService;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandler;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import javax.annotation.Nonnull;
import java.lang.reflect.Type;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import static java.util.concurrent.TimeUnit.MINUTES;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.junit.Assert.*;

@Ignore
@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class SystemMessagesServiceTest {

    private static final Log LOG = LogFactory.getLog(SystemMessagesService.class);

    CountDownLatch latch = new CountDownLatch(9);

    @LocalServerPort
    private int port;

    @Test
    public void test() throws InterruptedException, ExecutionException, TimeoutException {
        WebSocketStompClient stompClient = StompTestUtils.createWebSocketClient(new MappingJackson2MessageConverter());
        StompSession session = stompClient.connect(
                String.format("ws://localhost:%d/stomp/v0", port),
                new WebSocketHttpHeaders(),
                new SimpleSessionHandler()
        ).get(5, SECONDS);
        assertNotNull(session);
        assertTrue(latch.await(1, MINUTES));
    }

    private class SimpleSessionHandler implements StompSessionHandler {

        @Override
        public void afterConnected(@Nonnull StompSession session, @Nonnull StompHeaders connectedHeaders) {
            LOG.info().append("Established session ").append(session).commit();
            session.subscribe(WebSocketConfig.STREAMS_TOPIC, this);
        }

        @Override
        public void handleException(@Nonnull StompSession session, StompCommand command, @Nonnull StompHeaders headers, byte[] payload, Throwable exception) {
            LOG.error().append("Exception in session ")
                    .append(session)
                    .append(": ").append(exception)
                    .commit();
        }

        @Override
        public void handleTransportError(@Nonnull StompSession session, @Nonnull Throwable exception) {
            LOG.error().append("Transport error in session ")
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
            LOG.info().append("Got message: ").append(payload).commit();
            assertEquals(((StreamStatesMessageWrapper) payload).getId(), 9 - latch.getCount());
            latch.countDown();
        }
    }

}