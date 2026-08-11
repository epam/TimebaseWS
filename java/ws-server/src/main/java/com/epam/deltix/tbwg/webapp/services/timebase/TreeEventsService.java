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
import com.epam.deltix.tbwg.webapp.model.tree.events.*;
import com.epam.deltix.tbwg.webapp.services.timebase.playback.PlaybackListener;
import com.epam.deltix.tbwg.webapp.services.timebase.playback.PlaybackService;
import com.epam.deltix.tbwg.webapp.services.topic.TopicListener;
import com.epam.deltix.tbwg.webapp.services.topic.TopicService;
import com.epam.deltix.tbwg.webapp.services.view.ViewListener;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.util.*;

@Service
public class TreeEventsService implements SystemMessagesService.SubscribeUserListener {

    private static final Log LOG = LogFactory.getLog(TreeEventsService.class);

    private final SimpMessagingTemplate template;
    private final SystemMessagesService systemMessagesService;
    private final ViewService viewService;
    private final TopicService topicService;
    private final PlaybackService playbackService;
    private final TimebaseRegistry registry;
    private final TreeEventsListener masterEventsListener;

    private final Map<String, TreeEventsListener> userToListener = new HashMap<>();
    private final Map<String, TreeEventsListener> tbEventsListeners = new HashMap<>();

    public TreeEventsService(SimpMessagingTemplate template,
                             SystemMessagesService systemMessagesService,
                             ViewService viewService,
                             TopicService topicService,
                             PlaybackService playbackService,
                             TimebaseRegistry registry) {
        this.template = template;
        this.systemMessagesService = systemMessagesService;
        this.viewService = viewService;
        this.topicService = topicService;
        this.playbackService = playbackService;
        this.registry = registry;

        // Per-TB listeners handle stream DB state events with tbId context.
        for (TimebaseService tb : registry.getAll()) {
            TreeEventsListener tbListener = new TreeEventsListener(template, viewService, tb.getId());
            systemMessagesService.getStateListenerForTb(tb.getId()).subscribe(tbListener);
            tbEventsListeners.put(tb.getId() != null ? tb.getId() : "", tbListener);
        }

        // masterEventsListener handles views, topics and playback (no DB-state events).
        this.masterEventsListener = new TreeEventsListener(template, viewService);

        systemMessagesService.setSubscribeUserListener(this);
        this.viewService.subscribe(masterEventsListener);
        this.topicService.subscribe(masterEventsListener);
        this.playbackService.subscribe(masterEventsListener);
    }

    @Scheduled(fixedDelay = 1000)
    public void broadcastStreamsState() {
        masterEventsListener.broadcastEvents();
        tbEventsListeners.forEach((tbId, listener) -> listener.broadcastEvents());
        synchronized (userToListener) {
            userToListener.forEach((k, v) -> v.broadcastEvents());
        }
    }

    @PreDestroy
    public void preDestroy() {
        viewService.unsubscribe(masterEventsListener);
        topicService.unsubscribe(masterEventsListener);
        playbackService.unsubscribeListener(masterEventsListener);
        tbEventsListeners.forEach((tbId, listener) ->
            systemMessagesService.getStateListenerForTb(tbId.isEmpty() ? null : tbId).unsubscribe(listener));
    }

    @Override
    public void subscribed(String user, SystemMessagesNotifier notifier) {
        synchronized (userToListener) {
            TreeEventsListener listener = userToListener.get(user);
            if (listener == null) {
                userToListener.put(user, listener = new TreeEventsListener(template, user, viewService));
                notifier.subscribe(listener);
                viewService.subscribe(listener);
                topicService.subscribe(listener);
                playbackService.subscribe(listener);
            }
        }
    }

    public static class TreeEventsListener implements DBStateListener, ViewListener, TopicListener, PlaybackListener {

        private final SimpMessagingTemplate template;
        private final String endpoint;
        private final String tbId;

        private final ViewService viewService;

        private final List<TreeEvent> events = new ArrayList<>();

        public TreeEventsListener(SimpMessagingTemplate template, ViewService viewService) {
            this.template = template;
            this.endpoint = WebSocketConfig.STRUCTURE_EVENTS_TOPIC;
            this.viewService = viewService;
            this.tbId = null;
        }

        public TreeEventsListener(SimpMessagingTemplate template, String user, ViewService viewService) {
            this.template = template;
            this.endpoint = WebSocketConfig.STRUCTURE_EVENTS_TOPIC + "/" + user;
            this.viewService = viewService;
            this.tbId = null;
        }

        /** Per-TB master listener — same broadcast endpoint as master but carries tbId on events. */
        public TreeEventsListener(SimpMessagingTemplate template, ViewService viewService, String tbId) {
            this.template = template;
            this.endpoint = WebSocketConfig.STRUCTURE_EVENTS_TOPIC;
            this.viewService = viewService;
            this.tbId = tbId;
        }

        public void broadcastEvents() {
            List<TreeEvent> currentEvents = flushEvents();
            if (!currentEvents.isEmpty()) {
                template.convertAndSend(endpoint, currentEvents);
                LOG.trace().append("Send message to topic ")
                    .append(endpoint)
                    .append(": ")
                    .append(currentEvents.size())
                    .append(" events")
                    .commit();
            }
        }

        private List<TreeEvent> flushEvents() {
            synchronized (events) {
                Set<String> updates = new HashSet<>();
                List<TreeEvent> resultEvents = new ArrayList<>();
                for (int i = events.size() - 1; i >= 0; --i) {
                    TreeEvent event = events.get(i);
                    if (event.getAction() == TreeEventAction.UPDATE) {
                        if (!updates.contains(event.getId())) {
                            resultEvents.add(0, event);
                            updates.add(event.getId());
                        }
                    } else {
                        resultEvents.add(0, event);
                    }
                }

                events.clear();

                return resultEvents;
            }
        }

        @Override
        public void changed(String key) {
            LOG.info().append("STREAMS STATE: changed ").append(key).commit();
            if (viewService.isViewStream(key)) {
                return;
            }

            addEvent(new TreeEvent(TreeEventType.STREAM, TreeEventAction.UPDATE, key));
        }

        @Override
        public void added(String key) {
            LOG.info().append("STREAMS STATE: added ").append(key).commit();
            if (viewService.isViewStream(key)) {
                return;
            }

            addEvent(new TreeEvent(TreeEventType.STREAM, TreeEventAction.ADD, key));
        }

        @Override
        public void deleted(String key) {
            LOG.info().append("STREAMS STATE: deleted ").append(key).commit();
            if (viewService.isViewStream(key)) {
                return;
            }

            addEvent(new TreeEvent(TreeEventType.STREAM, TreeEventAction.REMOVE, key));
        }

        @Override
        public void renamed(String fromKey, String toKey) {
            LOG.info().append("STREAMS STATE: renamed ").append(fromKey).append(" -> ").append(toKey).commit();
            if (viewService.isViewStream(fromKey)) {
                return;
            }

            addEvent(new RenameStreamTreeEvent(TreeEventType.STREAM, TreeEventAction.RENAME, fromKey, toKey));
        }

        @Override
        public void created(ViewMd viewMd) {
            LOG.info().append("VIEWS STATE: created ").append(viewMd).commit();

            addEvent(new ViewTreeEvent(TreeEventType.VIEW, TreeEventAction.ADD, viewMd.getId(), viewMd));
        }

        @Override
        public void deleted(ViewMd viewMd) {
            LOG.info().append("VIEWS STATE: deleted ").append(viewMd).commit();

            addEvent(new ViewTreeEvent(TreeEventType.VIEW, TreeEventAction.REMOVE, viewMd.getId(), viewMd));
        }

        @Override
        public void updated(ViewMd viewMd) {
            LOG.info().append("VIEWS STATE: updated ").append(viewMd).commit();

            addEvent(new ViewTreeEvent(TreeEventType.VIEW, TreeEventAction.UPDATE, viewMd.getId(), viewMd));
        }

        @Override
        public void topicCreated(String topicKey) {
            LOG.trace().append("TOPIC STATE: added ").append(topicKey).commit();
            addEvent(new TreeEvent(TreeEventType.TOPIC, TreeEventAction.ADD, topicKey));
        }

        @Override
        public void topicDeleted(String topicKey) {
            LOG.trace().append("TOPIC STATE: deleted ").append(topicKey).commit();
            addEvent(new TreeEvent(TreeEventType.TOPIC, TreeEventAction.REMOVE, topicKey));
        }

        @Override
        public void topicRename(String topicKey, String newKey) {
            LOG.trace().append("TOPIC STATE: renamed ").append(topicKey).append(" -> ").append(newKey).commit();
            addEvent(new RenameStreamTreeEvent(TreeEventType.TOPIC, TreeEventAction.RENAME, topicKey, newKey));
        }

        private void addEvent(TreeEvent event) {
            event.setTbId(tbId);
            synchronized (events) {
                events.add(event);
            }
        }

        @Override
        public void playbackFinish(long id) {

        }

        @Override
        public void playbackCreated(long id) {
            LOG.info().append("PLAYBACK STATE: created ").append(id).commit();
            addEvent(new TreeEvent(TreeEventType.PLAYBACK, TreeEventAction.ADD, String.valueOf(id)));
        }
    }

}