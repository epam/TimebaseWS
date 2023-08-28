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
import com.epam.deltix.tbwg.webapp.model.tree.events.*;
import com.epam.deltix.tbwg.webapp.services.view.ViewListener;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import java.util.*;

@Service
public class TreeEventsService implements DBStateListener, ViewListener {

    private static final Log LOG = LogFactory.getLog(TreeEventsService.class);

    private final SimpMessagingTemplate template;
    private final SystemMessagesService systemMessagesService;
    private final ViewService viewService;
    private final List<TreeEvent> events = new ArrayList<>();

    public TreeEventsService(SimpMessagingTemplate template,
                             SystemMessagesService systemMessagesService,
                             ViewService viewService) {
        this.template = template;
        this.systemMessagesService = systemMessagesService;
        this.viewService = viewService;

        systemMessagesService.subscribe(this);
        viewService.subscribe(this);
    }

    @Scheduled(fixedDelay = 1000) // try to broadcast every 1 second
    public void broadcastStreamsState() {
        List<TreeEvent> currentEvents = flushEvents();
        if (!currentEvents.isEmpty()) {
            template.convertAndSend(WebSocketConfig.STRUCTURE_EVENTS_TOPIC, currentEvents);
        }
    }

    @PreDestroy
    public void preDestroy() {
        systemMessagesService.unsubscribe(this);
        viewService.unsubscribe(this);
    }

    @Override
    public void changed(String key) {
        LOG.trace().append("STREAMS STATE: changed ").append(key).commit();
        if (ViewService.isViewStream(key)) {
            return;
        }

        addEvent(new TreeEvent(TreeEventType.STREAM, TreeEventAction.UPDATE, key));
    }

    @Override
    public void added(String key) {
        LOG.trace().append("STREAMS STATE: added ").append(key).commit();
        if (ViewService.isViewStream(key)) {
            return;
        }

        addEvent(new TreeEvent(TreeEventType.STREAM, TreeEventAction.ADD, key));
    }

    @Override
    public void deleted(String key) {
        LOG.trace().append("STREAMS STATE: deleted ").append(key).commit();
        if (ViewService.isViewStream(key)) {
            return;
        }

        addEvent(new TreeEvent(TreeEventType.STREAM, TreeEventAction.REMOVE, key));
    }

    @Override
    public void renamed(String fromKey, String toKey) {
        LOG.trace().append("STREAMS STATE: renamed ").append(fromKey).append(" -> ").append(toKey).commit();
        if (ViewService.isViewStream(fromKey)) {
            return;
        }

        addEvent(new RenameStreamTreeEvent(TreeEventType.STREAM, TreeEventAction.RENAME, fromKey, toKey));
    }

    @Override
    public void created(ViewMd viewMd) {
        LOG.trace().append("VIEWS STATE: created ").append(viewMd).commit();

        addEvent(new ViewTreeEvent(TreeEventType.VIEW, TreeEventAction.ADD, viewMd.getId(), viewMd));
    }

    @Override
    public void deleted(ViewMd viewMd) {
        LOG.trace().append("VIEWS STATE: deleted ").append(viewMd).commit();

        addEvent(new ViewTreeEvent(TreeEventType.VIEW, TreeEventAction.REMOVE, viewMd.getId(), viewMd));
    }

    @Override
    public void updated(ViewMd viewMd) {
        LOG.trace().append("VIEWS STATE: updated ").append(viewMd).commit();

        addEvent(new ViewTreeEvent(TreeEventType.VIEW, TreeEventAction.UPDATE, viewMd.getId(), viewMd));
    }

    private void addEvent(TreeEvent event) {
        synchronized (events) {
            events.add(event);
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

}
