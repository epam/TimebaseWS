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
package com.epam.deltix.tbwg.webapp.controllers;

import com.epam.deltix.tbwg.webapp.services.timebase.MonitorService;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.WebSocketSessionsService;
import com.epam.deltix.tbwg.webapp.utils.HeaderAccessorHelper;
import com.epam.deltix.tbwg.webapp.websockets.WebSocketUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class MonitorController {

    private static final Log LOG = LogFactory.getLog(MonitorController.class);

    private static final String QQL = "qql";

    private final SimpMessagingTemplate messagingTemplate;
    private final MonitorService monitorService;
    private final WebSocketSessionsService sessionsService;
    private final TimebaseService timebaseService;

    private final HeaderAccessorHelper headerAccessorHelper = new HeaderAccessorHelper();

    @Autowired
    public MonitorController(SimpMessagingTemplate messagingTemplate, MonitorService monitorService,
                             WebSocketSessionsService sessionsService, TimebaseService timebaseService)
    {
        this.messagingTemplate = messagingTemplate;
        this.monitorService = monitorService;
        this.sessionsService = sessionsService;
        this.timebaseService = timebaseService;
    }

    @SubscribeMapping(WebSocketConfig.MONITOR_TOPIC + "/{streamKey}")
    public void subscribeStream(SimpMessageHeaderAccessor headerAccessor, @DestinationVariable String streamKey) {
        LOG.info().append("Subscribe to stream ").append(streamKey).commit();
        subscribe(headerAccessor, streamKey, null, WebSocketConfig.getMonitorTopic(streamKey));
    }

    @SubscribeMapping(WebSocketConfig.MONITOR_QQL_TOPIC)
    public void subscribeQql(SimpMessageHeaderAccessor headerAccessor) {
        String qql = headerAccessor.getFirstNativeHeader(QQL);

        LOG.info().append("Subscribe to qql ").append(qql).commit();

        subscribe(headerAccessor, null, qql, WebSocketConfig.MONITOR_QQL_TOPIC);
    }

    private void subscribe(SimpMessageHeaderAccessor headerAccessor, String stream, String qql, String destination) {
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();

        MessageHeaders headers = WebSocketUtils.generateHeaders(headerAccessor);

        long fromTimestamp = headerAccessorHelper.getTimestamp(headerAccessor);
        List<String> symbols = headerAccessorHelper.getSymbols(headerAccessor);
        List<String> types = headerAccessorHelper.getTypes(headerAccessor);

        monitorService.subscribe(sessionId, subscriptionId, stream, qql, fromTimestamp, types, symbols, messages -> {
            messagingTemplate.convertAndSendToUser(sessionId, destination, messages, headers);
        });

        sessionsService.add(sessionId, subscriptionId, () -> monitorService.unsubscribe(sessionId, subscriptionId));
    }

}
