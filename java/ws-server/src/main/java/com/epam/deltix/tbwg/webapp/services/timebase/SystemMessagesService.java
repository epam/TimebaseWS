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
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.ws.system.StreamStates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SystemMessagesService {

    private static final Log LOG = LogFactory.getLog(SystemMessagesService.class);

    private final SimpMessagingTemplate template;

    private final StreamsStateListener masterListener;

    private final Map<String, StreamsStateListener> userToListener = new HashMap<>();

    interface SubscribeUserListener {
        void subscribed(String user, SystemMessagesNotifier notifier);
    }

    private volatile SubscribeUserListener subscribeUserListener;

    @Autowired
    public SystemMessagesService(SimpMessagingTemplate template) {
        this.template = template;
        this.masterListener = new StreamsStateListener(template);
    }

    @PostConstruct
    public void logStart() {
        LOG.info().append("Starting ")
                .append(SystemMessagesService.class.getSimpleName())
                .append(" service.")
                .commit();
    }

    @Scheduled(fixedDelay = 1000)
    public void broadcastStreamsState() {
        masterListener.broadcastEvents();
        synchronized (userToListener) {
            userToListener.forEach((k, v) -> v.broadcastEvents());
        }
    }

    public StreamsStateListener getStateListener() {
        return masterListener;
    }

    public StreamsStateListener getStateListener(String user) {
        synchronized (userToListener) {
            StreamsStateListener listener = userToListener.get(user);
            if (listener == null) {
                userToListener.put(user, listener = new StreamsStateListener(template, user));
                subscribeUserListener.subscribed(user, listener);
            }

            return listener;
        }
    }

    public SystemMessagesNotifier masterNotifier() {
        return masterListener;
    }

    public void setSubscribeUserListener(SubscribeUserListener listener) {
        this.subscribeUserListener = listener;
    }

    public static class StreamsStateListener implements DBStateListener, SystemMessagesNotifier {

        private final SimpMessagingTemplate template;
        private final String endpoint;

        private final StreamStates streamStates = new StreamStates();

        private final CopyOnWriteArrayList<DBStateListener> subscribers = new CopyOnWriteArrayList<>();

        public StreamsStateListener(SimpMessagingTemplate template) {
            this.template = template;
            this.endpoint = WebSocketConfig.STREAMS_TOPIC;
        }

        public StreamsStateListener(SimpMessagingTemplate template, String user) {
            this.template = template;
            this.endpoint = WebSocketConfig.STREAMS_TOPIC + "/" + user;
        }

        public void broadcastEvents() {
            try {
                synchronized (streamStates) {
                    if (!streamStates.isEmpty()) {
                        template.convertAndSend(endpoint, streamStates);
                        if (LOG.isTraceEnabled()) {
                            LOG.trace().append("Send message to topic ")
                                .append(endpoint)
                                .append(": ")
                                .append(streamStates)
                                .commit();
                        }
                        streamStates.clear();
                    } else {
                        if (LOG.isTraceEnabled()) {
                            LOG.trace().append("Stream states are empty.").commit();
                        }
                    }
                }
            } catch (Throwable t) {
                LOG.error().append("Failed to broadcast events").append(t).commit();
            }
        }

        @Override
        public void subscribe(DBStateListener subscriber) {
            subscribers.add(subscriber);
        }

        @Override
        public void unsubscribe(DBStateListener subscriber) {
            subscribers.remove(subscriber);
        }

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