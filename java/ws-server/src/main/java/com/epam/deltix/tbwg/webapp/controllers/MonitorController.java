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
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.utils.HeaderAccessorHelper;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class MonitorController implements SubscriptionController {

    private final MonitorService monitorService;

    private final HeaderAccessorHelper headerAccessorHelper = new HeaderAccessorHelper();

    @Autowired
    public MonitorController(SubscriptionControllerRegistry registry, MonitorService monitorService) {
        registry.register(WebSocketConfig.MONITOR_TOPIC, this);
        this.monitorService = monitorService;
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {
        String stream = extractStreamKey(headerAccessor.getDestination());
        String sessionId = headerAccessor.getSessionId();
        String subscriptionId = headerAccessor.getSubscriptionId();

        long fromTimestamp = headerAccessorHelper.getTimestamp(headerAccessor);
        List<String> symbols = headerAccessorHelper.getSymbols(headerAccessor);
        List<String> types = headerAccessorHelper.getTypes(headerAccessor);

        monitorService.subscribe(sessionId, subscriptionId, stream, null, fromTimestamp, types, symbols, channel::sendMessage);
        return () -> monitorService.unsubscribe(sessionId, subscriptionId);
    }

    private String extractStreamKey(String destination) {
        String controlString = WebSocketConfig.MONITOR_TOPIC + "/";
        String url = destination.substring(0, destination.indexOf('?'));
        int id = url.indexOf(controlString);
        if (id < 0) {
            throw new RuntimeException("Can't extract stream name from destination: " + url);
        }

        return url.substring(id + controlString.length());
    }

}
