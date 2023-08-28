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
import java.util.List;

public class CompositeWorker implements Worker {

    private static final Log LOGGER = LogFactory.getLog(CompositeWorker.class);

    private final List<Worker> workers = new ArrayList<>();

    private volatile boolean closed;

    public synchronized void add(Worker worker) {
        workers.add(worker);
    }

    public synchronized void remove(Worker worker) {
        workers.remove(worker);
    }

    public synchronized int workersCount() {
        return workers.size();
    }

    @Override
    public int doWork() {
        if (!active()) {
            return 0;
        }

        synchronized (this) {
            int workDone = 0;
            for (Worker worker : workers) {
                try {
                    if (worker.active()) {
                        workDone += worker.doWork();
                    }
                } catch (Throwable t) {
                    LOGGER.error().append("Runnable worker failed.").append(t).commit();
                    worker.close();
                }
            }

            workers.removeIf(w -> !w.active());

            return workDone;
        }
    }

    @Override
    public boolean active() {
        return !closed;
    }

    @Override
    public void close() {
        closed = true;

        synchronized (this) {
            workers.forEach(Worker::close);
            workers.clear();
        }
    }
}
