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
package com.epam.deltix.tbwg.webapp.services.tasks;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;

@Service
public class StompSubscriptionTaskServiceImpl {

    private static final Log LOGGER = LogFactory.getLog(StompSubscriptionTaskServiceImpl.class);

    private final TaskExecutor taskExecutor;
    private final Table<String, String, StompSubscriptionTask> tasks = HashBasedTable.create();

    public StompSubscriptionTaskServiceImpl(TaskExecutor taskExecutor) {
        this.taskExecutor = taskExecutor;
    }

    @PreDestroy
    public synchronized void preDestroy() {
        tasks.values().forEach(StompSubscriptionTask::close);
        tasks.clear();
    }

    @Scheduled(fixedDelayString = "${subscriptions-service.log-tasks-period-ms:300000}")
    public synchronized void reload() {
        LOGGER.info().append("Active STOMP subscription tasks: ").append(tasks.size()).commit();
    }

    public synchronized void startTask(String sessionId, String subscriptionId, StompSubscriptionTask task) {
        task.setTaskExecutor(taskExecutor);
        task.setSubscriptionTaskService(this);
        taskExecutor.submitTask(task);
        tasks.put(sessionId, subscriptionId, task);

        LOGGER.debug().append("Task ").append(sessionId).append(":").append(subscriptionId).append(" submitted").commit();
    }

    public synchronized void stopTask(String sessionId, String subscriptionId) {
        StompSubscriptionTask task = tasks.remove(sessionId, subscriptionId);
        if (task != null) {
            task.close();

            LOGGER.debug().append("Task ").append(sessionId).append(":").append(subscriptionId).append(" closed").commit();
        }
    }

}
