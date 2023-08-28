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

import com.epam.deltix.gflog.api.LogLevel;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.google.gson.JsonParseException;
import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;

import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ws.*;
import com.epam.deltix.tbwg.webapp.services.MetricsService;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.util.concurrent.QuickExecutor;
import com.epam.deltix.util.time.TimeKeeper;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.util.*;


public class WSQueryHandler extends WSHandler {

    public WSQueryHandler(TimebaseService timebase, QuickExecutor executor, MetricsService metrics) {
        super(timebase, executor, metrics);
    }

    protected String endpoint() {
        return "/ws/v0/query";
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        metrics.endpointCounter(WebSocketConfig.SUBSCRIPTIONS_METRIC, endpoint()).increment();
        session.setTextMessageSizeLimit(MAX_BUFFER_SIZE);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message.getPayloadLength() != 0) {
            try {
                WSMessage wsMessage = gson.fromJson(message.getPayload(), WSMessage.class);
                if (wsMessage.messageType == MessageType.SUBSCRIBE_QUERY) {
                    if (isTaskExists(session)) {
                        LOGGER.info("Task for session %s already exists. Resubscribe is not supported...").with(session.getId());
                        session.sendMessage(new TextMessage(
                            gson.toJson(new WsEvent("ERROR", "Change subscription is not supported"))
                        ));
                        onClose(session);
                        return;
                    }

                    SubscribeQueryMessage subscribeMessage = (SubscribeQueryMessage) wsMessage;

                    SelectionOptions options = new SelectionOptions(true, subscribeMessage.live);
                    options.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;
                    long timestamp = subscribeMessage.from != null ?
                        subscribeMessage.from.toEpochMilli() :
                        (subscribeMessage.live ? TimeKeeper.currentTime : Long.MIN_VALUE);

                    List<String> symbols = subscribeMessage.symbols;
                    CharSequence[] instruments = symbols != null ?
                            symbols.toArray(new CharSequence[0]) : null;

                    InstrumentMessageSource messageSource = timebase.getConnection().executeQuery(
                        subscribeMessage.query, options, null, instruments, timestamp
                    );

                    String subscribeString =  subscribeMessage.query +
                        "; [from: " + (timestamp == Long.MIN_VALUE ? timestamp : Instant.ofEpochMilli(timestamp)) +
                        "; live: " + options.live +
                        "; symbols: " + (symbols == null ? "all" : Arrays.toString(symbols.toArray(new String[0]))) +
                        "]";
                    LOGGER.log(LogLevel.INFO, "WS QUERY CURSOR [" + messageSource.hashCode() + "]: " + subscribeString);

                    PumpTask pumpTask = new PumpTask(
                        null, (TickCursor) messageSource, Long.MAX_VALUE, subscribeMessage.live, session, metrics, executor
                    );
                    messageSource.setAvailabilityListener(pumpTask.avlnr);

                    onCreate(session, pumpTask);
                    pumpTask.submit();

                    session.sendMessage(new TextMessage(
                        gson.toJson(new WsEvent("OK", "Successfully subscribed to [" + subscribeString + "]"))
                    ));
                }
            } catch (JsonParseException | IllegalStateException exc) {
                session.sendMessage(new TextMessage(
                    gson.toJson(new WsEvent("ERROR", "unknown message format: " + exc.getMessage()))
                ));
                LOGGER.error().append("unknown message format: ")
                    .append(message.getPayload())
                    .append('\n')
                    .append(exc)
                    .commit();
                onClose(session);
            }
            return;
        }

        super.handleTextMessage(session, message);
    }
}
