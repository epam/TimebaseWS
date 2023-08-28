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

package com.epam.deltix.tbwg.webapp.services.tasks.workers;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class FixedSizeWorkersManager {
    private static final Log LOGGER = LogFactory.getLog(FixedSizeWorkersManager.class);

    private final int poolSize;
    private final ExecutorService taskExecutor;

    private final List<CompositeWorker> workers = new ArrayList<>();

    public FixedSizeWorkersManager(int poolSize) {
        this.poolSize = poolSize;
        this.taskExecutor = Executors.newFixedThreadPool(poolSize);
    }

    public synchronized void refresh() {
        clearEmptyWorkers();
    }

    public synchronized void start(Worker worker) {
        findCompositeWorker().add(worker);
        printStatistics();
    }

    public synchronized void close() {
        workers.forEach(CompositeWorker::close);
        taskExecutor.shutdown();
        try {
            taskExecutor.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            LOGGER.error().append("Shutdown timeout").append(e).commit();
        }
    }

    private void printStatistics() {
        LOGGER.info().append("CompositeWorkers count: ").append(workers.size()).commit();
        for (int i = 0; i < workers.size(); ++i) {
            LOGGER.info().append("CompositeWorkers #").append(i)
                .append(" tasks count:").append(workers.get(i).workersCount())
                .commit();
        }
    }

    private void clearEmptyWorkers() {
        workers.forEach(w -> {
            if (w.workersCount() == 0) {
                w.close();
            }
        });

        workers.removeIf(w -> w.workersCount() == 0);
    }

    private CompositeWorker findCompositeWorker() {
        if (workers.size() < poolSize) {
            return createAndAdd();
        }

        return workers.stream()
            .min(Comparator.comparingInt(CompositeWorker::workersCount))
            .orElseGet(this::createAndAdd);
    }

    private CompositeWorker createAndAdd() {
        CompositeWorker worker = new CompositeWorker();
        workers.add(worker);
        taskExecutor.submit(new RunnableWorker(worker));
        return worker;
    }

}
