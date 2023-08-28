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

package com.epam.deltix.tbwg.webapp.services.view;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.webapp.services.tasks.workers.FixedSizeWorkersManager;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.md.MutableQueryViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.MutableViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.repository.*;
import com.epam.deltix.tbwg.webapp.services.view.processor.ViewMdProcessorImpl;
import com.epam.deltix.tbwg.webapp.services.view.processor.ViewProcessingEvent;
import com.epam.deltix.tbwg.webapp.services.view.processor.ViewProcessingListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ViewServiceImpl implements ViewService, ViewProcessingListener, ViewMdEventsListener {

    private static final Log LOGGER = LogFactory.getLog(ViewServiceImpl.class);

    @Value("${views.processor.thread-pool-size:4}")
    private int threadPoolSize;

    private final TimebaseService timebaseService;
    private final ViewMdRepository mdRepository;
    private final ViewMdEventsPublisher mdEventsPublisher;
    private final TimebaseViewMdCache timebaseViewMdCache;

    private ViewMdProcessorImpl processor;
    private FixedSizeWorkersManager workersManager;

    private final List<ViewListener> listeners = new CopyOnWriteArrayList<>();

    public ViewServiceImpl(TimebaseService timebaseService) {
        this.timebaseService = timebaseService;
        this.timebaseViewMdCache = new TimebaseViewMdCache(timebaseService);
        this.mdRepository = timebaseViewMdCache;
        this.mdEventsPublisher = timebaseViewMdCache;
    }

    @PostConstruct
    public void init() {
        this.workersManager = new FixedSizeWorkersManager(threadPoolSize);
        this.processor = new ViewMdProcessorImpl(timebaseService, this, workersManager);

        this.mdEventsPublisher.subscribe(processor);
        this.mdEventsPublisher.subscribe(this);
        timebaseViewMdCache.start();
    }

    @PreDestroy
    public void destroy() {
        mdEventsPublisher.unsubscribe(processor);
        mdEventsPublisher.unsubscribe(this);

        timebaseViewMdCache.stop();
        processor.stop();
        workersManager.close();
    }

    @Scheduled(fixedDelayString = "${views.processor.refresh-period-ms:60000}")
    public void refresh() {
        workersManager.refresh();
    }

    @Override
    public synchronized void create(ViewMd viewMd) {
        ViewMd savedMd = mdRepository.findById(viewMd.getId());
        if (savedMd != null) {
            throw new IllegalArgumentException("View with id " + viewMd.getId() + " already exists");
        }

        mdRepository.saveAll(viewMd);
    }

    @Override
    public synchronized void restart(String viewId, Instant from) {
        ViewMd savedMd = mdRepository.findById(viewId);
        if (savedMd == null) {
            throw new IllegalArgumentException("View with id " + viewId + " doesn't exist");
        }

        if (savedMd instanceof MutableQueryViewMd) {
            MutableQueryViewMd queryMd = (MutableQueryViewMd) savedMd;
            queryMd.setInfo(null);
            queryMd.setState(ViewState.RESTARTED);
            queryMd.setLastTimestamp(from != null ? from.toEpochMilli() : Long.MIN_VALUE);
            mdRepository.saveAll(queryMd);
        } else {
            throw new RuntimeException("Invalid view metadata type");
        }
    }

    @Override
    public synchronized void stop(String viewId) {
        ViewMd savedMd = mdRepository.findById(viewId);
        if (savedMd == null) {
            throw new IllegalArgumentException("View with id " + viewId + " doesn't exist");
        }

        if (savedMd instanceof MutableQueryViewMd) {
            MutableQueryViewMd queryMd = (MutableQueryViewMd) savedMd;
            queryMd.setInfo(null);
            queryMd.setState(ViewState.STOPPED);
            mdRepository.saveAll(queryMd);
        } else {
            throw new RuntimeException("Invalid view metadata type");
        }
    }

    @Override
    public synchronized ViewMd get(String id) {
        return mdRepository.findById(id);
    }

    @Override
    public synchronized List<ViewMd> list() {
        return mdRepository.findAll();
    }

    @Override
    public synchronized void delete(String viewId) {
        ViewMd viewMd = mdRepository.findById(viewId);
        if (viewMd == null) {
            throw new IllegalArgumentException("View with id " + viewId + " doesn't exist");
        }

        mdRepository.delete(viewMd);
    }

    @Override
    public void onUpdate(ViewProcessingEvent event) {
        ViewMd viewMd = mdRepository.findById(event.getViewId());
        if (viewMd instanceof MutableViewMd) {
            MutableViewMd mutableMd = (MutableViewMd) viewMd;
            mutableMd.setState(event.getState());
            mutableMd.setLastTimestamp(event.getLastTimestamp());
            mutableMd.setInfo(event.getReason());

            mdRepository.saveAll(mutableMd);
        }
    }

    @Override
    public void subscribe(ViewListener listener) {
        listeners.add(listener);
    }

    @Override
    public void unsubscribe(ViewListener listener) {
        listeners.remove(listener);
    }

    @Override
    public void initialized(ViewMd viewMd) {
    }

    @Override
    public void created(ViewMd viewMd) {
        listeners.forEach(l -> l.created(viewMd));
    }

    @Override
    public void removed(ViewMd viewMd) {
        listeners.forEach(l -> l.deleted(viewMd));
        deleteStream(viewMd.getStream());
    }

    @Override
    public void updated(ViewMd viewMd) {
        listeners.forEach(l -> l.updated(viewMd));
    }

    private void deleteStream(String streamKey) {
        try {
            DXTickStream stream = timebaseService.getStream(streamKey);
            if (stream != null) {
                stream.delete();
            }
        } catch (Throwable t) {
            LOGGER.error().append("Failed to delete stream for removed view md").append(t).commit();
        }
    }
}
