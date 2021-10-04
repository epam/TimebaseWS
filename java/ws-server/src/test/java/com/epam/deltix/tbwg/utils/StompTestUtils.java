package com.epam.deltix.tbwg.utils;

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
