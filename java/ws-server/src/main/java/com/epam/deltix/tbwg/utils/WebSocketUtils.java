package com.epam.deltix.tbwg.utils;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;

public class WebSocketUtils {

    public static final String HEADER_TOKEN = "authorization";
    public static final String HEADER_STATUS = "status";

    public static MessageHeaders generateHeaders(final SimpMessageHeaderAccessor requestHeaderAccessor) {
        return generateHeaders(requestHeaderAccessor, HttpStatus.OK);
    }

    public static MessageHeaders generateHeaders(final SimpMessageHeaderAccessor requestHeaderAccessor,
                                                 final HttpStatus responseStatus) {
        final SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(requestHeaderAccessor.getSessionId()); // send only for current session
        headerAccessor.setNativeHeader(HEADER_STATUS, String.valueOf(responseStatus.value()));
        return headerAccessor.getMessageHeaders();
    }

}
