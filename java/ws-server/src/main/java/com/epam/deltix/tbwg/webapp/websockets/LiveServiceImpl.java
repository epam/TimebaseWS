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

import com.epam.deltix.tbwg.webapp.services.MetricsService;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.util.concurrent.QuickExecutor;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import java.util.Map;

/**
 * Created by Alex Karpovich on 6/27/2018.
 */
@Configuration
@EnableAutoConfiguration
@EnableWebSocket
@SuppressFBWarnings("NP_NULL_ON_SOME_PATH")
public class LiveServiceImpl implements WebSocketConfigurer {

    private QuickExecutor       executor = QuickExecutor.createNewInstance("Live Handler", null);

    private TimebaseService service;

    private MetricsService metrics;

    public LiveServiceImpl(TimebaseService timebaseService, MetricsService metrics) {
        this.service = timebaseService;
        this.metrics = metrics;
    }

    @Override
    public void         registerWebSocketHandlers(@NotNull WebSocketHandlerRegistry registry) {
        registry.addHandler(new WSHandler(service, executor, metrics),"/ws/v0/{streamId}/select")
                .addHandler(new WSHandler(service, executor, metrics), "/ws/v0/select")
                .addHandler(new WSQueryHandler(service, executor, metrics), "/ws/v0/query")
                .addHandler(new WSHandler(service, executor, metrics, service.getFlushPeriodMs()), "/ws/v0/{streamId}/monitor")
                .addInterceptors(new TemplateHandshakeInterceptor())
                .setAllowedOrigins("*");
    }

    private static class TemplateHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request,
                                       ServerHttpResponse response, WebSocketHandler wsHandler,
                                       Map<String, Object> attributes) throws Exception {

            /* Retrieve original HTTP request */
            HttpServletRequest origRequest =
                    ((ServletServerHttpRequest) request).getServletRequest();

            /* Retrieve template variables */
            Map<String, String> uriTemplateVars = (Map<String, String>) origRequest
                    .getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

            /* Put template variables into WebSocket session attributes */
            if (uriTemplateVars != null) {
                attributes.putAll(uriTemplateVars);
            }

            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response, WebSocketHandler wsHandler,
                                   Exception exception) {}
    }
}
