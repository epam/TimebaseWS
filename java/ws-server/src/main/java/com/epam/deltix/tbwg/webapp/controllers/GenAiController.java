/*
 * Copyright 2025 EPAM Systems, Inc
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

import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.genai.GenAiService;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.Principal;

@Controller
@CrossOrigin
public class GenAiController implements SubscriptionController {

    private final @Nullable GenAiService genAiService;

    public GenAiController(SubscriptionControllerRegistry registry,
                           @Autowired(required = false) @Nullable GenAiService genAiService) {
        registry.register(WebSocketConfig.GENAI_QQL_TOPIC, this);
        this.genAiService = genAiService;
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor headerAccessor, SubscriptionChannel channel) {
        if (genAiService == null) {
            channel.sendError("Gen AI service is disabled");
            return () -> {};
        }
        String userInput = headerAccessor.getFirstNativeHeader("userInput");
        String rawStreamKeys = headerAccessor.getFirstNativeHeader("streamKeys");
        if (userInput == null || userInput.isEmpty()) {
            channel.sendError(new IllegalArgumentException("userInput header is required"));
            return () -> {};
        }
        Principal user = headerAccessor.getUser();
        if (user == null) {
            channel.sendError(new IllegalArgumentException("User header is required"));
            return () -> {};
        }
        String username = user.getName();
        if (username == null || username.isEmpty()) {
            channel.sendError(new IllegalArgumentException("Username is required"));
            return () -> {};
        }

        genAiService.subscribe(username, userInput, rawStreamKeys, channel);
        return () -> genAiService.unsubscribe(channel);
    }
}
