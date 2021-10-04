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
package com.epam.deltix.tbwg.config;

import com.epam.deltix.tbwg.interceptors.WebSocketLogInterceptor;
import com.epam.deltix.tbwg.websockets.WebsocketChannelInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
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

    public static final String MONITOR_TOPIC = TOPIC + "/monitor";

    private final WebsocketChannelInterceptor channelInterceptor;
    private final WebSocketLogInterceptor logInterceptor;

    @Autowired
    public WebSocketConfig(WebsocketChannelInterceptor channelInterceptor, WebSocketLogInterceptor logInterceptor) {
        this.channelInterceptor = channelInterceptor;
        this.logInterceptor = logInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(SYSTEM_ENDPOINT).setAllowedOrigins("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.setPreservePublishOrder(true)
                .setApplicationDestinationPrefixes(TOPIC, USER)
                .enableSimpleBroker();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(channelInterceptor, logInterceptor);
    }

    public static String getMonitorTopic(String stream) {
        return MONITOR_TOPIC + "/" + stream;
    }
}
