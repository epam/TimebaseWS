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
package com.epam.deltix.tbwg.webapp.services.charting;

import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.time.Instant;

@Controller
public class QueryChartingController implements SubscriptionController {

    private static final Log LOG = LogFactory.getLog(LiveChartingController.class);

    private static final String CHART_TYPE_HEADER = "chartType";
    private static final String START_TIME_HEADER = "startTime";
    private static final String END_TIME_HEADER = "endTime";
    private static final String POINT_INTERVAL_HEADER = "pointInterval";
    private static final String LEVELS_HEADER = "levels";
    private static final String QUERY_HEADER = "query";

    private final LiveChartingService liveChartingService;

    public QueryChartingController(SubscriptionControllerRegistry registry,
                                   LiveChartingService liveChartingService)
    {
        registry.register(WebSocketConfig.CHARTING_QUERY_TOPIC, this);

        this.liveChartingService = liveChartingService;
    }

    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {
        String query = headerAccessor.getFirstNativeHeader(QUERY_HEADER);
        if (query == null || query.isEmpty()) {
            throw new IllegalArgumentException("Unknown query, specify '" + QUERY_HEADER + "' STOMP header.");
        }

        String chartTypeHeader = headerAccessor.getFirstNativeHeader(CHART_TYPE_HEADER);
        if (chartTypeHeader == null || chartTypeHeader.isEmpty()) {
            throw new IllegalArgumentException("Unknown chart type, specify '" + CHART_TYPE_HEADER + "' STOMP header.");
        }
        ChartType chartType = ChartType.valueOf(chartTypeHeader);

        Instant startTime = Instant.now();
        String startTimeHeader = headerAccessor.getFirstNativeHeader(START_TIME_HEADER);
        if (startTimeHeader != null && !startTimeHeader.isEmpty()) {
            startTime = Instant.parse(startTimeHeader);
        }

        Instant endTime = Instant.ofEpochMilli(ChartingService.MAX_TIMESTAMP);
        String endTimeHeader = headerAccessor.getFirstNativeHeader(END_TIME_HEADER);
        if (endTimeHeader != null && !endTimeHeader.isEmpty()) {
            endTime = Instant.parse(endTimeHeader);
        }

        String pointIntervalHeader = headerAccessor.getFirstNativeHeader(POINT_INTERVAL_HEADER);
        if (pointIntervalHeader == null || pointIntervalHeader.isEmpty()) {
            throw new IllegalArgumentException("Unknown point interval, specify '" + POINT_INTERVAL_HEADER + "' STOMP header.");
        }
        long pointInterval = Long.parseLong(pointIntervalHeader);

        String levelsHeader = headerAccessor.getFirstNativeHeader(LEVELS_HEADER);
        int levels = 10;
        if (levelsHeader != null && !levelsHeader.isEmpty()) {
            levels = Integer.parseInt(levelsHeader);
        }

        return subscribe(
            headerAccessor, channel,
            chartType, null, query, null, new TimeInterval(startTime, endTime), pointInterval, levels
        );
    }

    private Subscription subscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel,
                                   ChartType chartType, String stream, String query, String instrument, TimeInterval timeInterval,
                                   long pointInterval, int levels)
    {
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();

        LOG.info().append("Live chart subscribe: ")
            .append(stream != null ? stream : query)
            .append("[").append(instrument != null ? instrument : "")
            .append("|").append(timeInterval)
            .append("|").append(chartType)
            .append("|").append(pointInterval)
            .append("|").append(levels)
            .append("]")
            .append("; SessionId: ").append(sessionId)
            .append("; SubscriptionId: ").append(subscriptionId).commit();

        liveChartingService.subscribe(
            sessionId, subscriptionId,
            new ChartingSettings(
                stream, query, instrument, chartType, timeInterval, pointInterval, levels
            ),
            channel
        );

        return () -> {
            liveChartingService.unsubscribe(sessionId, subscriptionId);
        };
    }

}
