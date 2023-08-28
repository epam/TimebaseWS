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

package com.epam.deltix.tbwg.webapp.services.charting.queries;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.ChartingConfiguration;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ReactiveMessageSource;

import java.util.concurrent.*;

public class ChartingResultImpl implements ChartingResult {

    private static final Log LOGGER = LogFactory.getLog(ChartingResultImpl.class);

    private final LinesQuery query;
    private final LinesQueryResult result;
    private final ExecutorService defaultExecutor;
    private final ChartingConfiguration config;

    private ReactiveMessageSource messageSource;
    private Future<?> forwardFuture;
    private boolean closed;

    public ChartingResultImpl(LinesQuery query,
                              LinesQueryResult result,
                              ExecutorService defaultExecutor,
                              ChartingConfiguration config)
    {
        this.query = query;
        this.result = result;
        this.defaultExecutor = defaultExecutor;
        this.config = config;
    }

    @Override
    public LinesQuery getQuery() {
        return query;
    }

    @Override
    public LinesQueryResult result() {
        return result;
    }

    @Override
    public void run() {
        run(defaultExecutor);
    }

    @Override
    public void run(ExecutorService executor) {
        long startTime = System.currentTimeMillis();
        try {
            if (!start(executor)) {
                LOGGER.info()
                    .append("Queries: ").append(query)
                    .append("; Charting not started").commit();
                return;
            }

            LOGGER.info().append("Queries: ").append(query)
                .append("; Charting started").commit();

            try {
                if (query.isLive()) {
                    forwardFuture.get();
                } else {
                    forwardFuture.get(config.getQueryTimeoutSec(), TimeUnit.SECONDS);
                }
            } catch (InterruptedException | CancellationException e) {
                LOGGER.warn()
                    .append("Queries: ").append(query)
                    .append("; Running interrupted").commit();
            } catch (ExecutionException e) {
                LOGGER.error().append("Queries: ").append(query)
                    .append("; Charting failed").append(e).commit();
                throw new IllegalStateException(e);
            } catch (TimeoutException e) {
                if (executor instanceof ThreadPoolExecutor) {
                    ThreadPoolExecutor threadPoolExecutor = (ThreadPoolExecutor) executor;
                    int activeTasksCount = threadPoolExecutor.getActiveCount();
                    int maxPoolSize = threadPoolExecutor.getMaximumPoolSize();
                    if (activeTasksCount >= maxPoolSize) {
                        LOGGER.warn().append("Exceeded maximum charting tasks count. Active tasks ")
                            .append(activeTasksCount).append(" of ").append(maxPoolSize)
                            .append(". You can control charting tasks pool size with 'charting.max-pool-size' property.").commit();
                    }
                }

                LOGGER.error().append("Queries: ").append(query)
                    .append("; Charting timeout").append(e).commit();
                throw new RuntimeException("Long response");
            }
        } finally {
            close();
        }

        LOGGER.info()
            .append("Queries: ").append(query)
            .append("; Transformation time: ").append(System.currentTimeMillis() - startTime)
            .append("; points count: ").append(pointsCount())
            .commit();
    }

    private long pointsCount() {
        return result.getLines().stream().map(r -> r.pointsCount().get())
            .reduce(0L, Long::sum);
    }

    private synchronized boolean start(ExecutorService executor) {
        if (closed) {
            LOGGER.info().append("Query: ").append(query).append(" already closed").commit();
            return false;
        }

        if (messageSource != null || forwardFuture != null) {
            LOGGER.info().append("Query: ").append(query).append(" can't be run twice").commit();
            return false;
        }

        messageSource = result.getReactiveMessageSource();
        forwardFuture = executor.submit(messageSource);
        return true;
    }

    @Override
    public synchronized void close() {
        if (!closed) {
            closed = true;
            if (messageSource != null) {
                messageSource.close();
            }
            if (forwardFuture != null) {
                forwardFuture.cancel(true);
            }
        }
    }
}
