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
package com.epam.deltix.tbwg.webapp.websockets;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
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

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.util.ServletRequestPathUtils;
import org.springframework.web.util.UriTemplate;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Created by Alex Karpovich on 6/27/2018.
 */
@Configuration
@EnableAutoConfiguration
@EnableWebSocket
@SuppressFBWarnings("NP_NULL_ON_SOME_PATH")
public class LiveServiceImpl implements WebSocketConfigurer {

    static final Log LOGGER = LogFactory.getLog(WSHandler.class);
    public static final String WS_SELECT_STREAM_TEMPLATE = "/ws/v0/{streamId}/select";
    public static final String WS_SELECT_MONITOR_TEMPLATE = "/ws/v0/{streamId}/monitor";
    public static final String STREAM_ID = "streamId";

    private final QuickExecutor executor = QuickExecutor.createNewInstance("Live Handler", null);

    private final TimebaseService service;

    private final MetricsService metrics;

    public LiveServiceImpl(TimebaseService timebaseService, MetricsService metrics) {
        this.service = timebaseService;
        this.metrics = metrics;
    }

    @Override
    public void registerWebSocketHandlers(@NotNull WebSocketHandlerRegistry registry) {
        registry.addHandler(new WSHandler(service, executor, metrics), WS_SELECT_STREAM_TEMPLATE)
                .addHandler(new WSHandler(service, executor, metrics), "/ws/v0/select")
                .addHandler(new WSQueryHandler(service, executor, metrics), "/ws/v0/query")
                .addHandler(new WSHandler(service, executor, metrics, service.getFlushPeriodMs()), WS_SELECT_MONITOR_TEMPLATE)
                .addInterceptors(new TemplateHandshakeInterceptor())
                .addInterceptors(new WebSocketConfig.IpInterceptor())
                .setAllowedOrigins("*");
    }

    private static class TemplateHandshakeInterceptor implements HandshakeInterceptor {
        private final Map<String, UriTemplate> uriTemplates = Map.of(
                WS_SELECT_MONITOR_TEMPLATE, new UriTemplate(WS_SELECT_MONITOR_TEMPLATE),
                WS_SELECT_STREAM_TEMPLATE, new UriTemplate(WS_SELECT_STREAM_TEMPLATE));

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) {

            /* Retrieve original HTTP request */
            HttpServletRequest origRequest =
                    ((ServletServerHttpRequest) request).getServletRequest();

            /* Retrieve template variables */
//            Map<String, String> uriTemplateVars = (Map<String, String>) origRequest
//                    .getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE); does not work in the current version of spring. Try it later.
            String uriTemplate = (String) origRequest.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
            if (uriTemplates.containsKey(uriTemplate)) {
                String path = origRequest.getAttribute(ServletRequestPathUtils.PATH_ATTRIBUTE).toString();
                Map<String, String> match = uriTemplates.get(uriTemplate).match(path);
                if (match.containsKey(STREAM_ID)) {
                    String streamId = URLDecoder.decode(match.get(STREAM_ID), StandardCharsets.UTF_8);
                    attributes.put(STREAM_ID, streamId);
                } else {
                    LOGGER.warn().append("Not found 'streamId' path variable in path: ").append(path).append(" for '")
                            .append(uriTemplate).append("' endpoint").commit();
                }
            }

            attributes.put(WSHandler.PRINCIPAL_ATTRIBUTE_NAME, request.getPrincipal());
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response, WebSocketHandler wsHandler,
                                   Exception exception) {}
    }
}