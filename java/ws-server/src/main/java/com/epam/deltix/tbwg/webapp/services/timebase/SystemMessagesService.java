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

package com.epam.deltix.tbwg.webapp.services.timebase;


import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ws.system.StreamStates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SystemMessagesService {

    private static final Log LOG = LogFactory.getLog(SystemMessagesService.class);

    private final SimpMessagingTemplate template;

    private final StreamStates streamStates = new StreamStates();
    private final StreamsStateListener listener = new StreamsStateListener();

    private final CopyOnWriteArrayList<DBStateListener> subscribers = new CopyOnWriteArrayList<>();

    @Autowired
    public SystemMessagesService(SimpMessagingTemplate template) {
        this.template = template;
    }

    @PostConstruct
    public void logStart() {
        LOG.info().append("Starting ")
                .append(SystemMessagesService.class.getSimpleName())
                .append(" service.")
                .commit();
    }

    @Scheduled(fixedDelay = 1000) // try to broadcast every 1 second
    public void broadcastStreamsState() {
        synchronized (streamStates) {
            if (!streamStates.isEmpty()) {
                template.convertAndSend(WebSocketConfig.STREAMS_TOPIC, streamStates);
                if (LOG.isTraceEnabled()) {
                    LOG.trace().append("Send message to topic ")
                            .append(WebSocketConfig.STREAMS_TOPIC)
                            .append(": ")
                            .append(streamStates)
                            .commit();
                }
                streamStates.clear();
            } else {
                if (LOG.isTraceEnabled())
                    LOG.trace().append("Stream states are empty.").commit();
            }
        }
    }

    public DBStateListener getStateListener() {
        return listener;
    }

    public void subscribe(DBStateListener subscriber) {
        subscribers.add(subscriber);
    }

    public void unsubscribe(DBStateListener subscriber) {
        subscribers.remove(subscriber);
    }

    public class StreamsStateListener implements DBStateListener {

        @Override
        public void changed(String key) {
            LOG.trace().append("STREAMS STATE: changed ").append(key).commit();
            streamStates.putChanged(key);
            subscribers.forEach(s -> s.changed(key));
        }

        @Override
        public void added(String key) {
            LOG.trace().append("STREAMS STATE: added ").append(key).commit();
            streamStates.putAdded(key);
            subscribers.forEach(s -> s.added(key));
        }

        @Override
        public void deleted(String key) {
            LOG.trace().append("STREAMS STATE: deleted ").append(key).commit();
            streamStates.putDeleted(key);
            subscribers.forEach(s -> s.deleted(key));
        }

        @Override
        public void renamed(String fromKey, String toKey) {
            LOG.trace().append("STREAMS STATE: renamed {old: ")
                    .append(fromKey).append(", new: ")
                    .append(toKey).append("}")
                    .commit();
            streamStates.putRenamed(fromKey, toKey);
            subscribers.forEach(s -> s.renamed(fromKey, toKey));
        }
    }
}
