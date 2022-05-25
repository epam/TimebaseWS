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
package com.epam.deltix.tbwg.webapp.services.charting;

import com.epam.deltix.tbwg.webapp.services.charting.provider.LinesProvider;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.tasks.StompSubscriptionTaskServiceImpl;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class LiveChartingServiceImpl implements LiveChartingService {

    private static final Log LOGGER = LogFactory.getLog(LiveChartingStompSubscriptionTask.class);

    private final LinesProvider linesProvider;
    private final StompSubscriptionTaskServiceImpl subscriptionTaskService;
    private final SimpMessagingTemplate messagingTemplate;

    public LiveChartingServiceImpl(LinesProvider linesProvider,
                                   StompSubscriptionTaskServiceImpl subscriptionTaskService,
                                   SimpMessagingTemplate messagingTemplate)
    {
        this.linesProvider = linesProvider;
        this.subscriptionTaskService = subscriptionTaskService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void subscribe(String sessionId, String subscriptionId,
                          ChartingSettings chartingSettings,
                          SubscriptionChannel channel)
    {
        subscriptionTaskService.startTask(
            sessionId, subscriptionId,
            new LiveChartingStompSubscriptionTask(
                linesProvider, chartingSettings, channel
            )
        );
    }

    @Override
    public void unsubscribe(String sessionId, String subscriptionId) {
        subscriptionTaskService.stopTask(sessionId, subscriptionId);
    }
}
