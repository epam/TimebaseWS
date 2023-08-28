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

package com.epam.deltix.tbwg.webapp.services.view.processor;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.tasks.workers.Worker;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;

public abstract class ViewProcessingWorker implements Worker {

    private static final Log LOGGER = LogFactory.getLog(ViewProcessingWorker.class);

    private static final int UPDATE_EVENTS_DEBOUNCE_MS = 5000;
    private static final int IDLING_TIME_MS = 2000;

    private final ViewMd viewMd;
    private final ViewProcessingListener stateListener;

    protected final String streamKey;

    private long workDone;
    private long lastTimestamp;
    private long currentTimestamp = System.currentTimeMillis();
    private long unavailableTimestamp = Long.MIN_VALUE;

    protected volatile boolean closed;

    public ViewProcessingWorker(ViewMd viewMd, ViewProcessingListener stateListener) {
        this.viewMd = viewMd;
        this.stateListener = stateListener;
        this.streamKey = viewMd.getStream();
        this.lastTimestamp = viewMd.getLastTimestamp();
    }

    protected void started() {
        LOGGER.info().append("Process task for view ").append(viewMd.getId()).append(" started").commit();
        stateListener.onUpdate(ViewProcessingEvent.makeStarted(viewMd.getId(), viewMd.getLastTimestamp()));
    }

    protected void working(long count, long workTimestamp) {
        workDone += count;
        lastTimestamp = workTimestamp;
        unavailableTimestamp = Long.MIN_VALUE;
        if (System.currentTimeMillis() - currentTimestamp >= UPDATE_EVENTS_DEBOUNCE_MS) {
            currentTimestamp = System.currentTimeMillis();
            stateListener.onUpdate(ViewProcessingEvent.makeProgress(viewMd.getId(), lastTimestamp));
        }
    }

    protected void idling() {
        if (unavailableTimestamp == Long.MIN_VALUE) {
            unavailableTimestamp = System.currentTimeMillis();
        }

        // send progress message after n seconds after cursor become unavailable
        if (System.currentTimeMillis() - unavailableTimestamp >= IDLING_TIME_MS) {
            stateListener.onUpdate(ViewProcessingEvent.makeIdling(viewMd.getId(), lastTimestamp));
            unavailableTimestamp = System.currentTimeMillis() * 2; // never call until cursor become available
        }
    }

    protected void restarted() {
        stateListener.onUpdate(ViewProcessingEvent.makeRestarted(viewMd.getId()));
    }

    protected void finished() {
        finished(null);
    }

    protected void finished(Throwable error) {
        if (error == null) {
            LOGGER.info().append("Process task for view ").append(viewMd.getId()).append(" finished. Work done: ").append(workDone).commit();
            stateListener.onUpdate(ViewProcessingEvent.makeFinished(viewMd.getId(), lastTimestamp));
        } else {
            LOGGER.error().append("Process task for view ").append(viewMd.getId()).append(" failed").append(error).commit();
            stateListener.onUpdate(ViewProcessingEvent.makeFailed(viewMd.getId(), lastTimestamp, error, error.getMessage()));
        }
    }

    @Override
    public boolean active() {
        return !closed;
    }

    @Override
    public void close() {
        closed = true;
    }

    @Override
    public String toString() {
        return "ViewProcessingWorker{" +
            "id='" + viewMd.getId() + '\'' +
            "stream='" + streamKey + '\'' +
            '}';
    }
}
