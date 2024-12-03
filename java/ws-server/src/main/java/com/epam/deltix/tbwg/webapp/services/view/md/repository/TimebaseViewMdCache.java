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
package com.epam.deltix.tbwg.webapp.services.view.md.repository;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.lock.DBLock;
import com.epam.deltix.qsrv.hf.tickdb.pub.task.SchemaChangeTask;
import com.epam.deltix.qsrv.hf.tickdb.schema.*;
import com.epam.deltix.tbwg.messages.QueryViewMdMessage;
import com.epam.deltix.tbwg.messages.ViewMdMessage;
import com.epam.deltix.tbwg.messages.ViewMetadataMessage;
import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.services.view.md.MutableViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMdUtils;
import com.epam.deltix.tbwg.webapp.utils.TimeBaseUtils;
import com.epam.deltix.timebase.messages.ConstantIdentityKey;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.TimeStamp;
import com.epam.deltix.timebase.messages.service.RealTimeStartMessage;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

public class TimebaseViewMdCache implements ViewMdRepository, ViewMdEventsPublisher {

    private static final Log LOGGER = LogFactory.getLog(TimebaseViewMdCache.class);

    private static final long SYMBOL_HISTORY_MESSAGE_COUNT = 100;

    private final TimebaseService timebaseService;

    private final ExecutorService processEventsExecutor = Executors.newSingleThreadExecutor();

    private final List<ViewMdEventsListener> listeners = new CopyOnWriteArrayList<>();
    private final Map<String, ViewMd> views = new ConcurrentHashMap<>();
    private final Map<String, InstrumentMessageCounter> viewsMessageCounters = new ConcurrentHashMap<>();

    private volatile boolean initialized;
    private volatile boolean closed;

    private volatile DXTickStream stream;

    public TimebaseViewMdCache(TimebaseService timebaseService) {
        this.timebaseService = timebaseService;
    }

    public void start() {
        processEventsExecutor.submit(this::processEvents);
    }

    public void stop() {
        LOGGER.info().append("Stream view# processing stop").commit();
        closed = true;
        processEventsExecutor.shutdown();
    }

    private void processEvents() {
        LOGGER.info().append("Stream view# processing has started").commit();
        while (!closed) {
            try {
                processViewsStream(
                    ViewsStreamUtils.getViewsStream(timebaseService.getConnection())
                );
            } catch (Throwable t) {
                LOGGER.error().append("View processing failed: ").append(t.getMessage()).commit();
            }

            initialized = false;
            views.clear();

            if (!closed) {
                // todo: add disconnect/reconnect events to timebase service
                threadSleep(10000);
            }
        }
        LOGGER.info().append("Stream view# processing has completed").commit();
    }

    private void processViewsStream(DXTickStream viewStream) {
        this.stream = viewStream;
        DBLock lock = stream.lock();
        try (TickCursor cursor = openCursor(stream)) {
            LOGGER.info().append("Initializing views metadata...").commit();
            while (cursor.next()) {
                if (closed) {
                    return;
                }

                InstrumentMessage message = cursor.getMessage();
                if (!initialized) {
                    if (message instanceof RealTimeStartMessage) {
                        finishInit();
                        initialized = true;
                        LOGGER.info().append("Initializing views metadata finished").commit();
                    } else if (message instanceof ViewMetadataMessage) {
                        init((ViewMetadataMessage) message);
                    }
                } else if (message instanceof ViewMetadataMessage) {
                    process((ViewMetadataMessage) message);
                }
            }
        } catch (Throwable t) {
            if (!closed) {
                LOGGER.error().append("View metadata events processor failed").append(t).commit();
            }
        } finally {
            stream = null;
            lock.release();
        }
    }

    private TickCursor openCursor(DXTickStream views) {
        SelectionOptions selectionOptions = new SelectionOptions();
        selectionOptions.raw = false;
        selectionOptions.live = true;
        selectionOptions.realTimeNotification = true;

        return views.select(Long.MIN_VALUE, selectionOptions);
    }

    private TickLoader openLoader() {
        DXTickStream stream = getViewsMdStream();
        if (stream == null) {
            throw new RuntimeException("Can't find view md stream");
        }

        TickLoader loader = stream.createLoader(LoadingOptions.withRewriteMode(false));
        loader.addEventListener((e) -> LOGGER.error().append("Failed to send message").append(e).commit());

        return loader;
    }

    private DXTickStream getViewsMdStream() {
        return stream;
    }

    @Override
    public List<ViewMd> findAll() {
        if (!initialized) {
            throw new RuntimeException("View md cache is not initialized");
        }

        return new ArrayList<>(views.values());
    }

    @Override
    public ViewMd findById(String id) {
        if (!initialized) {
            throw new RuntimeException("View md cache is not initialized");
        }

        return views.get(id);
    }

    @Override
    public void saveAll(List<ViewMd> streamViews) {
        saveAll(streamViews.toArray(new ViewMd[0]));
    }

    @Override
    public void saveAll(ViewMd... streamViews) {
        if (!initialized) {
            throw new RuntimeException("View md cache is not initialized");
        }

        try (TickLoader loader = openLoader()) {
            for (int i = 0; i < streamViews.length; ++i) {
                loader.send(ViewMdUtils.INSTANCE.toMessage(streamViews[i]));
                getOrCreateCounter(streamViews[i]).clearIfNeed();
            }
            loader.flush();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void delete(ViewMd viewMd) {
        if (!initialized) {
            throw new RuntimeException("View md cache is not initialized");
        }

        if (viewMd instanceof MutableViewMd) {
            MutableViewMd mutableViewMd = (MutableViewMd) viewMd;
            mutableViewMd.setLastTimestamp(Long.MIN_VALUE);
            mutableViewMd.setInfo(null);
            mutableViewMd.setState(ViewState.REMOVED);
            saveAll(viewMd);
        }
    }

    @Override
    public boolean isInitialized() {
        return initialized;
    }

    @Override
    public void subscribe(ViewMdEventsListener viewMdEventsListener) {
        listeners.add(viewMdEventsListener);
    }

    @Override
    public void unsubscribe(ViewMdEventsListener viewMdEventsListener) {
        listeners.remove(viewMdEventsListener);
    }

    private void notifyInitialized(ViewMd viewMd) {
        listeners.forEach(l -> l.initialized(viewMd));
    }

    private void notifyCreated(ViewMd viewMd) {
        listeners.forEach(l -> l.created(viewMd));
    }

    private void notifyRemoved(ViewMd viewMd) {
        listeners.forEach(l -> l.removed(viewMd));
    }

    private void notifyUpdated(ViewMd viewMd) {
        listeners.forEach(l -> l.updated(viewMd));
    }

    private void init(ViewMetadataMessage viewMdMessage) {
        ViewMd viewMd = ViewMdUtils.INSTANCE.fromMessage(viewMdMessage);
        if (viewMd == null) {
            LOGGER.warn().append("Unknown view metadata type: ").append(viewMdMessage).commit();
        } else {
            init(viewMd);
        }
    }

    private void init(ViewMd viewMd) {
        views.put(viewMd.getId(), viewMd);
        getOrCreateCounter(viewMd).increment();
    }

    private void finishInit() {
        clearRemovedViews();
        views.forEach((id, viewMd) -> {
            notifyInitialized(viewMd);
        });
    }

    private void process(ViewMetadataMessage viewMdMessage) {
        ViewMd viewMd = ViewMdUtils.INSTANCE.fromMessage(viewMdMessage);
        if (viewMd == null) {
            LOGGER.warn().append("Unknown view metadata type: ").append(viewMdMessage).commit();
        } else {
            process(viewMd);
        }
    }

    private void process(ViewMd viewMd) {
        ViewMd savedMd = views.get(viewMd.getId());
        getOrCreateCounter(viewMd).increment();
        if (savedMd == null) {
            if (viewMd.getState() != ViewState.REMOVED) {
                views.put(viewMd.getId(), viewMd);
                notifyCreated(viewMd);
            }
        } else {
            if (viewMd.getState() == ViewState.REMOVED) {
                views.remove(viewMd.getId());
                notifyRemoved(viewMd);
            } else {
                views.put(viewMd.getId(), viewMd);
                notifyUpdated(viewMd);
            }
        }
    }

    private void clearRemovedViews() {
        List<ViewMd> removed = views.values().stream()
            .filter(v -> v.getState() == ViewState.REMOVED)
            .collect(Collectors.toList());
        if (removed.size() > 0) {
            clearViewsMd(removed.stream().map(ViewMd::getId).toArray(String[]::new));
            deleteViewStreams(removed.stream().map(ViewMd::getStream).toArray(String[]::new));
            removed.forEach(r -> views.remove(r.getId()));
        }
    }

    private void clearViewsMd(String... ids) {
        try {
            LOGGER.info().append("Removed views: ").append(
                Arrays.toString(ids)
            ).commit();

            DXTickStream stream = getViewsMdStream();
            if (stream != null) {
                stream.clear(
                    Arrays.stream(ids)
                        .map(ConstantIdentityKey::new)
                        .toArray(IdentityKey[]::new)
                );
            }
        } catch (Throwable t) {
            LOGGER.error().append("Failed to clear view md from in stream").append(t).commit();
        }
    }

    private void deleteViewStreams(String... keys) {
        try {
            for (String key : keys) {
                DXTickStream viewStream = timebaseService.getConnection().getStream(key);
                if (viewStream != null) {
                    viewStream.delete();
                }
            }
        } catch (Throwable t) {
            LOGGER.error().append("Failed to delete stream for removed view md").append(t).commit();
        }
    }

    private InstrumentMessageCounter getOrCreateCounter(ViewMd viewMd) {
        return viewsMessageCounters.computeIfAbsent(viewMd.getId(), k -> new InstrumentMessageCounter(timebaseService, viewMd));
    }

    private static class InstrumentMessageCounter {
        private final TimebaseService timebaseService;
        private final ViewMd viewMd;
        private final AtomicLong count = new AtomicLong();

        public InstrumentMessageCounter(TimebaseService timebaseService, ViewMd viewMd) {
            this.timebaseService = timebaseService;
            this.viewMd = viewMd;
        }

        public void increment() {
            count.incrementAndGet();
        }

        public void clearIfNeed() {
            if (count.get() > SYMBOL_HISTORY_MESSAGE_COUNT) {
                try {
                    DXTickStream stream = timebaseService.getConnection().getStream(ViewService.STREAM_VIEW_INFO);
                    if (stream != null) {
                        long timestamp = getNthMessageTimestamp(stream, viewMd.getId(), 10);
                        if (timestamp != Long.MIN_VALUE) {
                            stream.delete(
                                TimeStamp.fromMilliseconds(Long.MIN_VALUE),
                                TimeStamp.fromMilliseconds(timestamp - 1),
                                new ConstantIdentityKey(viewMd.getId())
                            );

                            LOGGER.info().append("Instruments ").append(stream.getKey())
                                .append("[").append(viewMd.getId()).append("] cleared with last timestamp ").append(timestamp)
                                .commit();
                        }
                    }
                } finally {
                    count.set(0);
                }
            }
        }

        private long getNthMessageTimestamp(DXTickStream stream, String symbol, int n) {
            SelectionOptions options = new SelectionOptions();
            options.reversed = true;
            options.raw = true;
            options.live = false;
            try (TickCursor cursor = stream.select(Long.MAX_VALUE, options, null, new CharSequence[] {symbol})) {

                InstrumentMessage message = null;
                while (cursor.next() && n-- > 0) {
                    message = cursor.getMessage();
                }

                if (n <= 0 && message != null) {
                    return message.getTimeStampMs();
                }

                return Long.MIN_VALUE;
            }
        }
    }

    public static void threadSleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

}