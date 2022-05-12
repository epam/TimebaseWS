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

import com.epam.deltix.tbwg.webapp.services.orderbook.OrderBookService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.WebSocketSessionsService;
import com.epam.deltix.tbwg.webapp.websockets.WebSocketUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Controller
public class OrderBookController {

    private static final Log LOG = LogFactory.getLog(OrderBookController.class);

    private static final String INSTRUMENT_HEADER = "instrument";
    private static final String STREAMS_LIST_HEADER = "streams";
    private static final String HIDDEN_EXCHANGES_LIST_HEADER = "hiddenExchanges";
    private static final String SUBSCRIPTION_ID = "subscriptionId";

    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketSessionsService sessionsService;
    private final OrderBookService orderBookService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public OrderBookController(SimpMessagingTemplate messagingTemplate,
                               WebSocketSessionsService sessionsService,
                               OrderBookService orderBookService)
    {
        this.messagingTemplate = messagingTemplate;
        this.sessionsService = sessionsService;
        this.orderBookService = orderBookService;
    }

    @SubscribeMapping(WebSocketConfig.ORDER_BOOK_TOPIC)
    public void subscribeStream(SimpMessageHeaderAccessor headerAccessor) throws JsonProcessingException {
        String instrument = headerAccessor.getFirstNativeHeader(INSTRUMENT_HEADER);
        if (instrument == null || instrument.isEmpty()) {
            throw new IllegalArgumentException("Unknown instrument, specify '" + INSTRUMENT_HEADER + "' STOMP header.");
        }

        String[] streams = getStringListHeader(headerAccessor, STREAMS_LIST_HEADER);
        if (streams == null || streams.length == 0) {
            throw new IllegalArgumentException("List is empty, specify '" + STREAMS_LIST_HEADER + "' STOMP header.");
        }

        String[] hiddenExchanges = getStringListHeader(headerAccessor, HIDDEN_EXCHANGES_LIST_HEADER);

        subscribe(headerAccessor, WebSocketConfig.ORDER_BOOK_TOPIC, instrument, streams, hiddenExchanges);
    }

    private String[] getStringListHeader(SimpMessageHeaderAccessor headerAccessor, String header) throws JsonProcessingException {
        List<String> valuesList = headerAccessor.getNativeHeader(header);
        if (valuesList == null) {
            return null;
        }

        return objectMapper.readValue(valuesList.get(0), String[].class);
    }

    private void subscribe(SimpMessageHeaderAccessor headerAccessor, String destination,
                           String instrument, String[] streams, String[] hiddenExchanges)
    {
        Principal user = headerAccessor.getUser();
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();
        MessageHeaders headers = WebSocketUtils.generateHeaders(headerAccessor);

        LOG.info().append("Order book subscribe: ")
            .append(instrument).append(" ").append(Arrays.toString(streams))
            .append("; SessionId: ").append(sessionId)
            .append("; SubscriptionId: ").append(subscriptionId).commit();

        orderBookService.subscribe(
            sessionId, subscriptionId, instrument, streams, hiddenExchanges,
            (l2PackageDto) -> {
                if (LOG.isTraceEnabled()) {
                    LOG.trace().append("Sending L2PackageDto for instrument ").append(instrument)
                        .append(": ").append(Instant.ofEpochMilli(l2PackageDto.timestamp))
                        .append(": Streams: ").append(Arrays.toString(streams))
                        .append(": Session Id: ").append(sessionId)
                        .append(": Subscription Id: ").append(subscriptionId).commit();
                }

                messagingTemplate.convertAndSendToUser(sessionId, destination, l2PackageDto, headers);
            }
        );
        sessionsService.add(
            sessionId,
            headerAccessor.getSubscriptionId(),
            () -> {
                LOG.info().append("Order book unsubscribe: ")
                    .append(instrument).append(" ").append(Arrays.toString(streams))
                    .append("; SessionId: ").append(sessionId)
                    .append("; SubscriptionId: ").append(subscriptionId).commit();

                orderBookService.unsubscribe(sessionId, subscriptionId, instrument);
            }
        );

    }
}
