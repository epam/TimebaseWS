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

import org.springframework.messaging.converter.MessageConverter;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import javax.websocket.ContainerProvider;
import javax.websocket.WebSocketContainer;

public class StompTestUtils {

    public static WebSocketStompClient createWebSocketClient(MessageConverter converter) {
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