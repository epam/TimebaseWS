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
package com.epam.deltix.tbwg.services;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketSubscriptionServiceImpl implements WebSocketSubscriptionService {

    private final Map<String, Map<String, Runnable>> unsubscribeCommands = new HashMap<>();

    public void add(final String sessionId, final String subscriptionId, final Runnable unsubscribeCommand) {
        synchronized (unsubscribeCommands) {
            final Map<String, Runnable> commands = unsubscribeCommands.computeIfAbsent(sessionId, key -> new HashMap<>());
            commands.put(subscriptionId, unsubscribeCommand);
        }
    }

    public void unsubscribe(final String sessionId, final String subscriptionId) {
        final Runnable runnable;
        synchronized (unsubscribeCommands) {
            Map<String, Runnable> commands = unsubscribeCommands.get(sessionId);
            if (commands == null)
                return;
            runnable = commands.remove(subscriptionId);
            if (runnable == null)
                return;
            commands.remove(subscriptionId);
            if (commands.isEmpty()) {
                unsubscribeCommands.remove(sessionId);
            }
        }
        runnable.run();
    }

    public void unsubscribe(final String sessionId) {
        final Map<String, Runnable> commands;
        synchronized (unsubscribeCommands) {
            commands = unsubscribeCommands.get(sessionId);
            if (commands == null)
                return;
            unsubscribeCommands.remove(sessionId);
        }
        commands.values().forEach(Runnable::run);
    }

}
