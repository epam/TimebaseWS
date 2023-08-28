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

package com.epam.deltix.tbwg.webapp.services.tasks;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.concurrent.*;

@Service
public class TaskExecutorImpl implements TaskExecutor {

    private static final Log LOGGER = LogFactory.getLog(TaskExecutorImpl.class);

    @Value("${task-executor-service.max-tasks:50}")
    private int maxTasks;

    private ScheduledExecutorService scheduledExecutorService;
    private ExecutorService executorService;

    @PostConstruct
    public void init() {
        scheduledExecutorService = Executors.newScheduledThreadPool(maxTasks);
        executorService = Executors.newFixedThreadPool(maxTasks);
    }

    @PreDestroy
    public synchronized void preDestroy() {
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

    @Scheduled(fixedDelayString = "${subscriptions-service.log-tasks-period-ms:300000}")
    public synchronized void reload() {
        if (executorService instanceof ThreadPoolExecutor) {
            LOGGER.info().append("Active executor tasks: ").append(((ThreadPoolExecutor) executorService).getActiveCount()).commit();
        }
    }

    @Override
    public ExecutorService executorService() {
        return executorService;
    }

    public ScheduledFuture<?> scheduleTask(Runnable command, long initialDelay, long period, TimeUnit unit) {
        return scheduledExecutorService.scheduleAtFixedRate(command, initialDelay, period, unit);
    }

    public Future<?> submitTask(Runnable task) {
        return executorService.submit(task);
    }
}
