/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.orderbook;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.orderbook.L2PackageDto;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.concurrent.*;
import java.util.function.Consumer;

@Service
public class OrderBookServiceImpl implements OrderBookService {

    private static final Log LOGGER = LogFactory.getLog(OrderBookServiceImpl.class);

    @Value("${timebase.order-book.max-tasks:50}")
    private int maxTasks;

    @Value("${timebase.order-book.flush-period-ms:2000}")
    private int flushPeriodMs;

    @Value("${timebase.order-book.use-legacy-converter:false}")
    private boolean useLegacyConverter;

    private ScheduledExecutorService scheduledExecutorService;
    private ExecutorService executorService;

    private final Table<String, String, Task> tasks = HashBasedTable.create();

    private final TimebaseService timebase;

    private static final class Task {
        private final ScheduledFuture<?> scheduledFuture;
        private final OrderBookSubscription subscription;

        private Task(ScheduledFuture<?> scheduledFuture, OrderBookSubscription subscription) {
            this.scheduledFuture = scheduledFuture;
            this.subscription = subscription;
        }

        public void cancel() {
            TBWGUtils.cancel(scheduledFuture, true);
            subscription.close();
        }
    }

    public OrderBookServiceImpl(TimebaseService timebase) {
        this.timebase = timebase;
    }

    @PostConstruct
    public void init() {
        scheduledExecutorService = Executors.newScheduledThreadPool(maxTasks);
        executorService = Executors.newFixedThreadPool(maxTasks);
    }

    @PreDestroy
    public synchronized void preDestroy() {
        tasks.values().forEach(Task::cancel);
        tasks.clear();

        try {
            executorService.shutdown();
        } catch (Throwable t) {
            LOGGER.error().append("Failed to shutdown executor service").append(t).commit();
        }

        try {
            scheduledExecutorService.shutdown();
        } catch (Throwable t) {
            LOGGER.error().append("Failed to shutdown scheduled executor service").append(t).commit();
        }
    }

    @Override
    public synchronized void subscribe(String sessionId, String subscriptionId,
                                       String instrument, String[] streams, String[] hiddenExchanges,
                                       Consumer<L2PackageDto> consumer)
    {
        OrderBookSubscription subscription = new OrderBookSubscription(
            timebase, instrument, streams, hiddenExchanges, consumer
        );
        ScheduledFuture<?> scheduledFuture = scheduledExecutorService.scheduleAtFixedRate(
            subscription::processUpdate,
            flushPeriodMs, flushPeriodMs, TimeUnit.MILLISECONDS
        );
        executorService.submit(subscription);
        tasks.put(sessionId, subscriptionId, new Task(scheduledFuture, subscription));
    }

    @Override
    public synchronized void unsubscribe(String sessionId, String subscriptionId, String instrument) {
        Task task = tasks.remove(sessionId, subscriptionId);
        if (task != null) {
            task.cancel();
        }
    }

}
