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
package com.epam.deltix.tbwg.webapp.websockets;

import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ErrorDef;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;

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

    public static MessageHeaders generateHeaders(final String sessionId, final HttpStatus responseStatus) {
        final SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(sessionId);
        headerAccessor.setNativeHeader(HEADER_STATUS, String.valueOf(responseStatus.value()));
        return headerAccessor.getMessageHeaders();
    }

    public static void sendError(SimpMessagingTemplate messagingTemplate, ErrorDef error, String sessionId) {
        String userDestination = WebSocketUtils.getUserDestination(WebSocketConfig.RPC_FEED, sessionId);
        messagingTemplate.convertAndSend(
            userDestination, error,
            WebSocketUtils.generateHeaders(sessionId, HttpStatus.INTERNAL_SERVER_ERROR)
        );
    }

    public static String getUserDestination(String originDestination, String sessionId) {
        return String.format("%s-user%s", originDestination, sessionId);
    }
}
