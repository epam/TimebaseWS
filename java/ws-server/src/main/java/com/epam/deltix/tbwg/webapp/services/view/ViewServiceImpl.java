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
package com.epam.deltix.tbwg.webapp.services.view;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.ClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidQueryException;
import com.epam.deltix.tbwg.webapp.services.view.md.QueryViewMd;
import com.epam.deltix.util.parsers.CompilationException;
import com.epam.deltix.tbwg.webapp.services.tasks.workers.FixedSizeWorkersManager;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
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

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class ViewServiceImpl implements ViewService, ViewProcessingListener, ViewMdEventsListener {

    private static final Log LOGGER = LogFactory.getLog(ViewServiceImpl.class);

    @Value("${views.processor.thread-pool-size:4}")
    private int threadPoolSize;

    private final TimebaseRegistry registry;
    private final Map<String, TimebaseViewMdCache> caches = new LinkedHashMap<>();

    private ViewMdProcessorImpl processor;
    private FixedSizeWorkersManager workersManager;

    private final List<ViewListener> listeners = new CopyOnWriteArrayList<>();

    public ViewServiceImpl(TimebaseRegistry registry) {
        this.registry = registry;
        for (TimebaseService tb : registry.getAll()) {
            caches.put(tb.getId(), new TimebaseViewMdCache(tb));
        }
    }

    @PostConstruct
    public void init() {
        this.workersManager = new FixedSizeWorkersManager(threadPoolSize);
        this.processor = new ViewMdProcessorImpl(registry, this, workersManager);

        for (TimebaseViewMdCache cache : caches.values()) {
            cache.subscribe(processor);
            cache.subscribe(this);
            cache.start();
        }
    }

    @PreDestroy
    public void destroy() {
        for (TimebaseViewMdCache cache : caches.values()) {
            cache.unsubscribe(processor);
            cache.unsubscribe(this);
            cache.stop();
        }
        processor.stop();
        workersManager.close();
    }

    @Scheduled(fixedDelayString = "${views.processor.refresh-period-ms:60000}")
    public void refresh() {
        workersManager.refresh();
    }

    @Override
    public boolean isViewStream(String key) {
        if (!isAnyInitialized()) {
            return false;
        }

        if (key != null && key.endsWith(VIEW_STREAM_SUFFIX)) {
            return findAcrossAll(getIdByKey(key)) != null;
        }
        return false;
    }

    @Override
    public synchronized void create(ViewMd viewMd, String tbId) throws InvalidQueryException {
        if (findAcrossAll(viewMd.getId()) != null) {
            throw new IllegalArgumentException("View with id " + viewMd.getId() + " already exists");
        }

        TimebaseService tb = registry.resolve(tbId);
        if (viewMd instanceof QueryViewMd) {
            String query = ((QueryViewMd) viewMd).getQuery();
            try {
                ClassSet classSet = tb.getConnection().describeQuery(query, new SelectionOptions());
                ClassDescriptor[] descriptors = classSet.getClasses();
                for (ClassDescriptor descriptor : descriptors) {
                    if (descriptor.getName() == null) {
                        throw new NullPointerException("Query result set contains types with empty name. " +
                            "Use `TYPE` keyword to specify type name for result set, for example: `SELECT a, b, c TYPE MyType`");
                    }
                }
            } catch (CompilationException e) {
                throw new InvalidQueryException(query);
            }
        }

        if (viewMd instanceof MutableViewMd) {
            ((MutableViewMd) viewMd).setTbId(tb.getId());
        }

        findCache(tb.getId()).saveAll(viewMd);
    }

    @Override
    public synchronized void restart(String viewId, String tbId, Instant from) {
        ViewMd savedMd = findViewMd(viewId, tbId);
        if (savedMd == null) {
            throw new IllegalArgumentException("View with id " + viewId + " doesn't exist");
        }

        if (savedMd instanceof MutableQueryViewMd) {
            MutableQueryViewMd queryMd = (MutableQueryViewMd) savedMd;
            queryMd.setInfo(null);
            queryMd.setState(ViewState.RESTARTED);
            queryMd.setLastTimestamp(from != null ? from.toEpochMilli() : Long.MIN_VALUE);
            findCache(savedMd.getTbId()).saveAll(queryMd);
        } else {
            throw new RuntimeException("Invalid view metadata type");
        }
    }

    @Override
    public synchronized void stop(String viewId, String tbId) {
        ViewMd savedMd = findViewMd(viewId, tbId);
        if (savedMd == null) {
            throw new IllegalArgumentException("View with id " + viewId + " doesn't exist");
        }

        if (savedMd instanceof MutableQueryViewMd) {
            MutableQueryViewMd queryMd = (MutableQueryViewMd) savedMd;
            queryMd.setInfo(null);
            queryMd.setState(ViewState.STOPPED);
            findCache(savedMd.getTbId()).saveAll(queryMd);
        } else {
            throw new RuntimeException("Invalid view metadata type");
        }
    }

    @Override
    public synchronized ViewMd get(String id, String tbId) {
        return findViewMd(id, tbId);
    }

    @Override
    public synchronized List<ViewMd> list(String tbId) {
        if (tbId != null && !tbId.isEmpty()) {
            TimebaseViewMdCache cache = caches.get(tbId);
            if (cache == null) return Collections.emptyList();
            if (!cache.isInitialized()) {
                LOGGER.warn().append("[").append(tbId).append("] View md cache not yet initialized, returning empty list").commit();
                return Collections.emptyList();
            }
            return cache.findAll();
        }
        return caches.values().stream()
            .filter(TimebaseViewMdCache::isInitialized)
            .flatMap(c -> c.findAll().stream())
            .collect(Collectors.toList());
    }

    @Override
    public synchronized void delete(String viewId, String tbId) {
        ViewMd viewMd = findViewMd(viewId, tbId);
        if (viewMd == null) {
            throw new IllegalArgumentException("View with id " + viewId + " doesn't exist");
        }

        findCache(viewMd.getTbId()).delete(viewMd);
    }

    @Override
    public void onUpdate(ViewProcessingEvent event) {
        ViewMd viewMd = findAcrossAll(event.getViewId());
        if (viewMd instanceof MutableViewMd) {
            MutableViewMd mutableMd = (MutableViewMd) viewMd;
            mutableMd.setState(event.getState());
            mutableMd.setLastTimestamp(event.getLastTimestamp());
            mutableMd.setInfo(event.getReason());

            findCache(mutableMd.getTbId()).saveAll(mutableMd);
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
        deleteStream(viewMd);
    }

    @Override
    public void updated(ViewMd viewMd) {
        listeners.forEach(l -> l.updated(viewMd));
    }

    private ViewMd findViewMd(String id, String tbId) {
        if (tbId != null && !tbId.isEmpty()) {
            TimebaseViewMdCache cache = caches.get(tbId);
            if (cache != null) {
                try {
                    ViewMd found = cache.findById(id);
                    if (found != null) return found;
                } catch (RuntimeException ignored) {}
            }
        }
        return findAcrossAll(id);
    }

    private ViewMd findAcrossAll(String id) {
        for (TimebaseViewMdCache cache : caches.values()) {
            try {
                ViewMd found = cache.findById(id);
                if (found != null) return found;
            } catch (RuntimeException ignored) {
                // cache not yet initialized
            }
        }
        return null;
    }

    private TimebaseViewMdCache findCache(String tbId) {
        TimebaseViewMdCache cache = caches.get(tbId);
        if (cache == null) {
            // fall back to default
            cache = caches.get(registry.getDefault().getId());
        }
        if (cache == null) {
            throw new IllegalStateException("No view cache available");
        }
        return cache;
    }

    private boolean isAnyInitialized() {
        return caches.values().stream().anyMatch(TimebaseViewMdCache::isInitialized);
    }

    private void deleteStream(ViewMd viewMd) {
        try {
            TimebaseService tb = registry.resolve(viewMd.getTbId());
            DXTickStream stream = tb.getStream(viewMd.getStream());
            if (stream != null) {
                stream.delete();
            }
        } catch (Throwable t) {
            LOGGER.error().append("Failed to delete stream for removed view md").append(t).commit();
        }
    }

    private String getIdByKey(String key) {
        return key.substring(0, key.length() - VIEW_STREAM_SUFFIX.length());
    }

}
