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
package com.epam.deltix.tbwg.webapp.config;

import com.epam.deltix.tbwg.webapp.interceptors.WebSocketLogInterceptor;
import com.epam.deltix.tbwg.webapp.websockets.StompErrorHandler;
import com.epam.deltix.tbwg.webapp.websockets.WebsocketAuthChannelInterceptor;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public static final String TOPIC = "/topic";
    public static final String USER = "/user";
    public static final String SYSTEM_ENDPOINT = "/stomp/v0";
    public static final String STREAMS_TOPIC = TOPIC + "/streams";
    public static final String FLOWCHART_TOPIC = TOPIC + "/flowchart";
    public static final String FLOWCHART_METADATA_TOPIC = FLOWCHART_TOPIC + "/metadata";
    public static final String FLOWCHART_RING_CENTER_TOPIC = FLOWCHART_TOPIC + "/ringCenter";
    public static final String FLOWCHART_TREE_TOPIC = FLOWCHART_TOPIC + "/ltrTree";

    public static final String MONITOR_TOPIC = TOPIC + "/monitor";
    public static final String MONITOR_QQL_TOPIC = TOPIC + "/monitor-qql";
    public static final String ORDER_BOOK_TOPIC = TOPIC + "/order-book";
    public static final String CHARTING_TOPIC = TOPIC + "/charting";
    public static final String CHARTING_QUERY_TOPIC = TOPIC + "/charting-query";

    public static final String RPC_FEED = TOPIC + "/responses";
    public static final String IMPORT_FILE_TOPIC = TOPIC + "/import";

    private final SubscriptionService subscriptionService;
    private final WebsocketAuthChannelInterceptor authChannelInterceptor;
    private final WebSocketLogInterceptor logInterceptor;
    private final StompErrorHandler errorHandler;

    @Autowired
    public WebSocketConfig(SubscriptionService subscriptionService, WebsocketAuthChannelInterceptor authChannelInterceptor,
                           WebSocketLogInterceptor logInterceptor, StompErrorHandler errorHandler)
    {
        this.subscriptionService = subscriptionService;
        this.authChannelInterceptor = authChannelInterceptor;
        this.logInterceptor = logInterceptor;
        this.errorHandler = errorHandler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(SYSTEM_ENDPOINT).setAllowedOrigins("*");
        registry.setErrorHandler(errorHandler);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.setPreservePublishOrder(true)
            .setApplicationDestinationPrefixes(TOPIC, USER)
            .enableSimpleBroker()
            .setTaskScheduler(heartBeatScheduler());
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor, subscriptionService.inboundChannelInterceptor(), logInterceptor);
    }

    @Bean
    public TaskScheduler heartBeatScheduler() {
        return new ThreadPoolTaskScheduler();
    }

    public static String getMonitorTopic(String stream) {
        return MONITOR_TOPIC + "/" + stream;
    }

    public static String getChartingTopic(String stream) {
        return CHARTING_TOPIC + "/" + stream;
    }
}
