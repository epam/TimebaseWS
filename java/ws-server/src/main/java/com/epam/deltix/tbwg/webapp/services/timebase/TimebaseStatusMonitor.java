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
package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ws.TimebaseStatusEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class TimebaseStatusMonitor {

    private static final Log LOGGER = LogFactory.getLog(TimebaseStatusMonitor.class);

    private final TimebaseRegistry registry;
    private final SimpMessagingTemplate template;

    private final ConcurrentMap<String, Boolean> lastKnownConnected = new ConcurrentHashMap<>();

    @Autowired
    public TimebaseStatusMonitor(TimebaseRegistry registry, SimpMessagingTemplate template) {
        this.registry = registry;
        this.template = template;
    }

    @Scheduled(fixedDelayString = "${timebase.status.poll-period-ms:10000}")
    public void pollStatus() {
        for (TimebaseService tb : registry.getAll()) {
            String tbId = tb.getId();
            boolean connected = tb.isConnected();

            Boolean previous = lastKnownConnected.put(tbId, connected);
            if (previous == null) {
                // First observation of this instance: just record the baseline, don't notify.
                continue;
            }

            if (previous != connected) {
                LOGGER.info().append("Timebase [").append(tbId).append("] status changed: connected=")
                        .append(connected).commit();
                template.convertAndSend(
                        WebSocketConfig.TIMEBASE_STATUS_TOPIC,
                        new TimebaseStatusEvent(tbId, connected, connected ? null : tb.getLastError())
                );
            }
        }
    }
}
