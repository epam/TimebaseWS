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
import com.epam.deltix.tbwg.webapp.services.tasks.workers.idle.BackoffIdleStrategy;
import com.epam.deltix.tbwg.webapp.services.tasks.workers.idle.IdleStrategy;

import static java.util.Objects.requireNonNull;

public class RunnableWorker implements Worker, Runnable {

    private static final Log LOGGER = LogFactory.getLog(RunnableWorker.class);

    protected final Worker worker;
    protected final IdleStrategy idleStrategy;

    public RunnableWorker(Worker worker) {
        this(worker, new BackoffIdleStrategy(1L, 10L, 50_000L, 100_000_000L));
    }

    public RunnableWorker(Worker worker, IdleStrategy strategy) {
        this.worker = requireNonNull(worker);
        this.idleStrategy = requireNonNull(strategy);
    }

    @Override
    public void run() {
        doWork();
    }

    @Override
    public int doWork() {
        while (worker.active()) {
            try {
                int work = worker.doWork();
                idleStrategy.idle(work);
            } catch (final Throwable e) {
                LOGGER.error().append("Runnable worker failed.").append(e).commit();
                worker.close();
            }
        }

        return 1;
    }

    @Override
    public boolean active() {
        return worker.active();
    }

    @Override
    public void close() {
        try {
            worker.close();
        } catch (final Throwable e) {
            throw new RuntimeException(e);
        }
    }

}

