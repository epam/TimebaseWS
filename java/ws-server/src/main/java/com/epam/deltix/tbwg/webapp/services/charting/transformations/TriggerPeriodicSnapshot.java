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
package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.SnapshotMessage;
import com.epam.deltix.timebase.messages.MarketMessageInfo;

import java.util.Collections;

/**
 * The transformation converts legacy market message (bbo, l2, level2, trade) to package header.
 */
public class TriggerPeriodicSnapshot extends AbstractChartTransformation<SnapshotMessage, MarketMessageInfo> {

    private final PeriodicityFilter filter;

    public TriggerPeriodicSnapshot(long periodicity) {
        super(Collections.singletonList(MarketMessageInfo.class), Collections.singletonList(SnapshotMessage.class));

        this.filter = new PeriodicityFilter(periodicity);
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(MarketMessageInfo message) {
        if (filter.test(message)) {
            sendMessage(new SnapshotMessage(message.getTimeStampMs()));
        }

        sendMessage(message);
    }

}
