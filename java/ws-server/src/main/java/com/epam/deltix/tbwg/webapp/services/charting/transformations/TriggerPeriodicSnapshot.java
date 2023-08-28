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

package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.SnapshotMessage;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.service.RealTimeStartMessage;

import java.util.Collections;

/**
 *
 */
public class TriggerPeriodicSnapshot extends AbstractChartTransformation<SnapshotMessage, MessageInfo> {

    private long periodicity;
    private long lastTimestamp = System.currentTimeMillis();
    private boolean isLive;

    public TriggerPeriodicSnapshot(long periodicity) {
        super(Collections.singletonList(InstrumentMessage.class), Collections.singletonList(SnapshotMessage.class));
        this.periodicity = periodicity;
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(MessageInfo message) {
        if (message instanceof RealTimeStartMessage) {
            isLive = true;
        }

        if (isLive) {
            long currentTime = System.currentTimeMillis();
            if (currentTime - lastTimestamp > periodicity) {
                lastTimestamp = currentTime;
                sendMessage(new SnapshotMessage(currentTime));
            }
        }

        sendMessage(message);
    }

}
