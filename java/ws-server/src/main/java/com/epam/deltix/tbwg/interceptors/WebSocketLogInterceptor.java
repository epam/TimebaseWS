package com.epam.deltix.tbwg.interceptors;

import com.epam.deltix.gflog.api.*;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class WebSocketLogInterceptor implements ChannelInterceptor {

    private static final Log LOGGER = LogFactory.getLog(WebSocketLogInterceptor.class);

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        final StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.isHeartbeat())
            return message;

        try {
            Principal user = accessor.getUser();
            String userName = user != null ? user.getName() : "Unknown";

            LOGGER.info()
                .append("WS command: ").append(accessor.getShortLogMessage(message.getPayload()))
                .append(", User: ").append(userName)
                .commit();
        } catch (Throwable t) {
            LOGGER.error().append("Error pre handle rest query").append(t).commit();
        }

        return message;
    }
}

