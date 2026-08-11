/*
 * Copyright 2024 EPAM Systems, Inc
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

import com.epam.deltix.tbwg.webapp.model.orderbook.L2PackageDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.services.orderbook.OrderBookService;
import com.epam.deltix.tbwg.webapp.services.orderbook.OrderBookSubscriptionOptions;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;

@Controller
public class OrderBookController implements SubscriptionController {

    private static final Log LOG = LogFactory.getLog(OrderBookController.class);

    private static final String INSTRUMENT_HEADER = "instrument";
    private static final String SOURCE_HEADER = "source";
    private static final String STREAMS_LIST_HEADER = "streams";
    private static final String HIDDEN_EXCHANGES_LIST_HEADER = "hiddenExchanges";
    private static final String TB_HEADER = "tbId";

    private final OrderBookService orderBookService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public OrderBookController(SubscriptionControllerRegistry subscriptionRegistry, OrderBookService orderBookService) {
        subscriptionRegistry.register(WebSocketConfig.ORDER_BOOK_TOPIC, this);
        this.orderBookService = orderBookService;
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {

        OrderBookSubscriptionOptions subscriptionOptions = getSubscriptionOptions(headerAccessor, channel);
        return subscribe(headerAccessor, channel, subscriptionOptions);
    }

    private OrderBookSubscriptionOptions getSubscriptionOptions(SimpMessageHeaderAccessor headerAccessor,
                                                                SubscriptionChannel channel) {
        String instrument = headerAccessor.getFirstNativeHeader(INSTRUMENT_HEADER);
        if (instrument == null || instrument.isEmpty()) {
            throw new IllegalArgumentException("Unknown instrument, specify '" + INSTRUMENT_HEADER + "' STOMP header.");
        }
        ModelDataSourceType source;
        try {
            source = ModelDataSourceType.valueOf(headerAccessor.getFirstNativeHeader(SOURCE_HEADER));
        } catch (Exception e){
            throw new IllegalArgumentException("Unknown datasource, specify '" + SOURCE_HEADER + "' STOMP header.");
        }

        String[] streams = getStringListHeader(headerAccessor, channel, STREAMS_LIST_HEADER);
        if (streams == null || streams.length == 0) {
            throw new IllegalArgumentException("List is empty, specify '" + STREAMS_LIST_HEADER + "' STOMP header.");
        }

        String[] hiddenExchanges = getStringListHeader(headerAccessor, channel, HIDDEN_EXCHANGES_LIST_HEADER);
        return new OrderBookSubscriptionOptions(instrument, source, streams, hiddenExchanges);
    }

    private String[] getStringListHeader(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel, String header) {
        try {
            List<String> valuesList = headerAccessor.getNativeHeader(header);
            if (valuesList == null) {
                return null;
            }

            return objectMapper.readValue(valuesList.get(0), String[].class);
        } catch (JsonProcessingException e) {
            channel.sendError(e);
            throw new RuntimeException(e);
        }
    }

    private Subscription subscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel,
                                   OrderBookSubscriptionOptions so)
    {
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();

        LOG.info().append("Order book subscribe: ")
                .append(so.getInstrument()).append(" ")
                .append(Arrays.toString(so.getStreams()))
                .append("; Source: ").append(so.getSource())
                .append("; SessionId: ").append(sessionId)
                .append("; SubscriptionId: ").append(subscriptionId).commit();

        String tb = headerAccessor.getFirstNativeHeader(TB_HEADER);
        orderBookService.subscribe(
            sessionId, subscriptionId, so.getInstrument(), so.getStreams(), so.getHiddenExchanges(),
            tb,
            (l2PackageDto) -> {
                if (LOG.isTraceEnabled()) {
                    LOG.trace().append("Sending L2PackageDto for instrument ").append(so.getInstrument())
                        .append(": ").append(Instant.ofEpochMilli(l2PackageDto.timestamp))
                        .append(": Streams: ").append(Arrays.toString(so.getStreams()))
                        .append(": Session Id: ").append(sessionId)
                        .append(": Subscription Id: ").append(subscriptionId).commit();
                }

                channel.sendMessage(l2PackageDto);
            }
        );

        return () -> {
            LOG.info().append("Order book unsubscribe: ")
                    .append(so.getInstrument()).append(" ")
                    .append(Arrays.toString(so.getStreams()))
                    .append("; Source: ").append(so.getSource())
                    .append("; SubscriptionId: ").append(subscriptionId).commit();

            orderBookService.unsubscribe(sessionId, subscriptionId, so.getInstrument());
        };
    }

}