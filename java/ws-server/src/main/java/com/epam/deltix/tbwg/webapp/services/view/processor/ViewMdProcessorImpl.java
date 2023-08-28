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
import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.webapp.services.tasks.workers.FixedSizeWorkersManager;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.md.QueryViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import com.epam.deltix.tbwg.webapp.services.view.md.repository.ViewMdEventsListener;

import java.util.Map;
import java.util.concurrent.*;

public class ViewMdProcessorImpl implements ViewMdEventsListener, ViewProcessingListener {

    private static final Log LOGGER = LogFactory.getLog(ViewMdProcessorImpl.class);

    private final TimebaseService timebaseService;
    private final ViewProcessingListener viewProcessingListener;

    private final ExecutorService actionsExecutor = Executors.newSingleThreadExecutor();
    private final FixedSizeWorkersManager workersManager;

    private final Map<String, ViewProcessingWorker> runningWorkers = new ConcurrentHashMap<>();

    public ViewMdProcessorImpl(TimebaseService timebaseService,
                               ViewProcessingListener viewProcessingListener,
                               FixedSizeWorkersManager workersManager) {
        this.timebaseService = timebaseService;
        this.viewProcessingListener = viewProcessingListener;
        this.workersManager = workersManager;
    }

    public void stop() {
        actionsExecutor.submit(() -> {
            LOGGER.info().append("View Md shutdown started...").commit();
            runningWorkers.forEach((id, worker) -> worker.close());
            runningWorkers.clear();
        });
        actionsExecutor.shutdown();
        try {
            if (!actionsExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                LOGGER.warn().append("View Md actions shutdown timeout").commit();
            }
        } catch (InterruptedException e) {
            LOGGER.warn().append("View Md actions shutdown interrupted").commit();
        }
    }

    @Override
    public void initialized(ViewMd viewMd) {
        LOGGER.info().append("View init: ").append(viewMd).commit();

        if (!viewMd.getState().isFinal()) {
            actionsExecutor.submit(() -> startTaskAction(viewMd));
        }
    }

    @Override
    public void created(ViewMd viewMd) {
        LOGGER.info().append("View create: ").append(viewMd).commit();

        actionsExecutor.submit(() -> startTaskAction(viewMd));
    }

    @Override
    public void removed(ViewMd viewMd) {
        LOGGER.info().append("View remove: ").append(viewMd).commit();

        actionsExecutor.submit(() -> removeTaskAction(viewMd));
    }

    @Override
    public void updated(ViewMd viewMd) {
        LOGGER.info().append("View update: ").append(viewMd).commit();

        if (viewMd.getState() == ViewState.RESTARTED) {
            actionsExecutor.submit(() -> startTaskAction(viewMd));
        } else if (viewMd.getState().isFinal()) {
            actionsExecutor.submit(() -> removeTaskAction(viewMd));
        }
    }

    @Override
    public void onUpdate(ViewProcessingEvent event) {
        LOGGER.info().append("View updated: ").append(event).commit();
        actionsExecutor.submit(() -> viewProcessingListener.onUpdate(event));
    }

    private void startTaskAction(ViewMd viewMd) {
        ViewProcessingWorker removedWorker = runningWorkers.remove(viewMd.getId());
        if (removedWorker != null) {
            removedWorker.close();
        }

        if (viewMd instanceof QueryViewMd) {
            QueryViewProcessingWorker worker = new QueryViewProcessingWorker((QueryViewMd) viewMd, this, timebaseService);
            runningWorkers.put(viewMd.getId(), worker);

            LOGGER.info().append("Found new view worker to process: ").append(worker).commit();
            workersManager.start(worker);
        } else {
            throw new RuntimeException("Invalid stream view worker type");
        }
    }

    private void removeTaskAction(ViewMd viewMd) {
        ViewProcessingWorker worker = runningWorkers.remove(viewMd.getId());
        if (worker != null) {
            worker.close();
        }
        LOGGER.info().append("Worker removed: ").append(viewMd).commit();
    }

}
