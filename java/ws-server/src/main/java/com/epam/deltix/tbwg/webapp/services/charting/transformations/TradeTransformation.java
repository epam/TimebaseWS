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

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.tbwg.webapp.model.charting.line.ExecutionTagElementDef;
import com.epam.deltix.tbwg.webapp.model.charting.line.TagType;
import com.epam.deltix.tbwg.messages.ChangePeriodicity;
import com.epam.deltix.tbwg.messages.ExecutionTag;
import com.epam.deltix.tbwg.messages.Message;

import java.util.Collections;

public class TradeTransformation extends AbstractChartTransformation<ExecutionTagElementDef, ExecutionTag> {

    private final PeriodicityFilter filter;
    private final long startTime;
    private final long endTime;
    private final ExecutionTagElementDef element = new ExecutionTagElementDef();

    public TradeTransformation(long periodicity, long startTime, long endTime) {
        super(Collections.singletonList(ExecutionTag.class), Collections.singletonList(ExecutionTagElementDef.class));

        this.startTime = startTime;
        this.endTime = endTime;
        this.filter = new PeriodicityFilter(periodicity, true);
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof ChangePeriodicity) {
            filter.setPeriodicity(((ChangePeriodicity) message).getPeriodicity());
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(ExecutionTag trade) {
        if (trade.getTimeStampMs() < startTime || trade.getTimeStampMs() > endTime) {
            return;
        }

        if (filter.test(trade)) {
            element.setTime(trade.getTimeStampMs());
            element.setTagType(TagType.EXECUTION);
            element.setValue(Decimal64Utils.toString(trade.getValue()));
            element.setPrice(Decimal64Utils.toString(trade.getPrice()));
            element.setSize(Decimal64Utils.toString(trade.getSize()));
            element.setSide(trade.getSide());
            sendMessage(element);
        }
    }
}
