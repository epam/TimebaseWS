package com.epam.deltix.tbwg.websockets;

import com.epam.deltix.tbwg.utils.ExceptionToHttpStatusConverter;
import com.epam.deltix.tbwg.utils.WebSocketUtils;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

@Component
public class StompErrorHandler extends StompSubProtocolErrorHandler {

    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        Message<byte[]> base = super.handleClientMessageProcessingError(clientMessage, ex);

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.create(StompCommand.MESSAGE);
        headerAccessor.setLeaveMutable(true);
        for (String key : base.getHeaders().keySet()) {
            if (key.equals("stompCommand")) {
                continue;
            }
            headerAccessor.setHeader(key, base.getHeaders().get(key));
        }

        if (clientMessage != null) {
            StompHeaderAccessor clientHeaderAccessor = MessageHeaderAccessor.getAccessor(clientMessage, StompHeaderAccessor.class);
            if (clientHeaderAccessor != null) {
                // For CONNECT we want to send error instead of message.
                if (clientHeaderAccessor.getDestination() == null || clientHeaderAccessor.getDestination().isEmpty()) {
                    headerAccessor.setHeader("stompCommand", StompCommand.ERROR);
                }
            }
        }

        headerAccessor.setNativeHeader(WebSocketUtils.HEADER_STATUS, String.valueOf(ExceptionToHttpStatusConverter.getStatus(ex)));
        return MessageBuilder.createMessage(base.getPayload(), headerAccessor.getMessageHeaders());
    }

}
