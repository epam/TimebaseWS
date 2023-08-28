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

package com.epam.deltix.tbwg.webapp.websockets;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ErrorDef;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice
public class GlobalMessageExceptionHandler {

    private static final Log LOGGER = LogFactory.getLog(GlobalMessageExceptionHandler.class);

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public GlobalMessageExceptionHandler(final SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageExceptionHandler({
            ConversionFailedException.class,
            IllegalArgumentException.class,
            IllegalStateException.class
    })
    public void handleBadRequestException(final Exception e, final SimpMessageHeaderAccessor headerAccessor) {
        internalExceptionHandler(e, headerAccessor, HttpStatus.BAD_REQUEST);
    }

    @MessageExceptionHandler(Throwable.class)
    public void handleException(final Throwable e, final SimpMessageHeaderAccessor headerAccessor) {
        internalExceptionHandler(e, headerAccessor, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private void internalExceptionHandler(Throwable e, SimpMessageHeaderAccessor headerAccessor, HttpStatus status) {
        LOGGER.warn().append(e).commit();

        ErrorDef errorDto = new ErrorDef();
        errorDto.message = e.getMessage();
        errorDto.name = "stomp_error";
        String sessionId = headerAccessor.getSessionId();
        String userDestination = WebSocketUtils.getUserDestination(WebSocketConfig.RPC_FEED, sessionId);
        messagingTemplate.convertAndSend(userDestination, errorDto, WebSocketUtils.generateHeaders(headerAccessor, status));
    }
}
