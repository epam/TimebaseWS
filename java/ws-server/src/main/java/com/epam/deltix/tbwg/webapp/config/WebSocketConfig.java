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
package com.epam.deltix.tbwg.webapp.config;

import com.epam.deltix.tbwg.webapp.interceptors.WebSocketLogInterceptor;
import com.epam.deltix.tbwg.webapp.websockets.StompErrorHandler;
import com.epam.deltix.tbwg.webapp.websockets.WebsocketAuthChannelInterceptor;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public static final String TOPIC = "/topic";
    public static final String SYSTEM_ENDPOINT = "/stomp/v0";
    public static final String STREAMS_TOPIC = TOPIC + "/streams";
    public static final String STRUCTURE_EVENTS_TOPIC = TOPIC + "/structure-events";
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
    public static final String IMPORT_TOPIC = TOPIC + "/startImport";
    public static final String IMPORT_CSV_TOPIC = IMPORT_TOPIC + "/csv";
    public static final String IMPORT_QSMSG_TOPIC = IMPORT_TOPIC + "/qsmsg";

    public static final String SUBSCRIPTIONS_METRIC = "websocket.subscriptions";

    public static final String SEND_MESSAGES_METRIC = "websocket.messages";

    private final SubscriptionService subscriptionService;
    private final WebsocketAuthChannelInterceptor authChannelInterceptor;
    private final WebSocketLogInterceptor logInterceptor;
    private final StompErrorHandler errorHandler;

    @Value("${websocket.send-buffer-size-limit:524288}") // The default value is 512K (i.e. 512 * 1024).
    private int bufferSizeLimit;
    @Value("${websocket.message-size-limit:65536}") // The default value is 64K (i.e. 64 * 1024)
    private int messageSizeLimit;
    @Value("${websocket.send-time-limit:10000}") // The default value is 10 seconds (i.e. 10 * 1000).
    private int timeLimit;

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
            .setApplicationDestinationPrefixes(TOPIC, SubscriptionService.DESTINATION_PREFIX)
            .enableSimpleBroker()
            .setTaskScheduler(heartBeatScheduler());
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor, subscriptionService.inboundChannelInterceptor(), logInterceptor);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        registry.setSendTimeLimit(timeLimit)
                .setSendBufferSizeLimit(bufferSizeLimit)
                .setMessageSizeLimit(messageSizeLimit);
    }

    @Bean
    public TaskScheduler heartBeatScheduler() {
        return new ThreadPoolTaskScheduler();
    }

}
