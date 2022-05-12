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

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.tbwg.messages.BboPoint;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.SnapshotMessage;
import com.epam.deltix.tbwg.webapp.model.charting.line.BBOElementDef;

import java.util.Collections;

/**
 * The transformation aggregates bbo from l1 data and converts into dto.
 */
public class BboAggregationTransformation extends AbstractChartTransformation<BBOElementDef, BboPoint> {

    private final PeriodicityFilter filter;
    private final long startTime;
    private final long endTime;
    private final BBOElementDef bbo = new BBOElementDef();

    private long bidPrice = Decimal64Utils.NULL;
    private long askPrice = Decimal64Utils.NULL;

    public BboAggregationTransformation(String symbol, long periodicity, long startTime, long endTime) {
        super(Collections.singletonList(BboPoint.class), Collections.singletonList(BBOElementDef.class));

        this.filter = new PeriodicityFilter(periodicity, true);
        this.startTime = startTime;
        this.endTime = endTime;
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof SnapshotMessage) {
            if (bidPrice != Decimal64Utils.NULL && askPrice != Decimal64Utils.NULL) {
                send(((SnapshotMessage) message).getTimestamp());
            }
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(BboPoint point) {
        if (point.getTimeStampMs() < startTime) {
            return;
        }

        bidPrice = point.getBidPrice();
        askPrice = point.getAskPrice();

        if (bidPrice != Decimal64Utils.NULL && askPrice != Decimal64Utils.NULL) {
            if (filter.test(point)) {
                send(point.getTimeStampMs());
            }
        }
    }

    private void send(long timestamp) {
        bbo.setTime(timestamp);
        bbo.setBidPrice(Decimal64Utils.toString(bidPrice));
        bbo.setAskPrice(Decimal64Utils.toString(askPrice));

        sendMessage(bbo);
    }

}
