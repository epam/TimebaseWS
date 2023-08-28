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
import com.epam.deltix.tbwg.messages.BboPoint;
import com.epam.deltix.tbwg.messages.FeedStatusMessage;
import com.epam.deltix.tbwg.messages.SnapshotMessage;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.model.charting.line.BarElementDef;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.timebase.messages.service.FeedStatus;

import java.util.Collections;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;

/**
 * The transformation aggregates bars from l1 data and converts into dto.
 */
public class BboToBarTransformation extends AbstractChartTransformation<BarElementDef, BboPoint> {

    private final long periodicity;
    private final long startTime;
    private final long endTime;
    private final ChartType chartType;

    private final BarElementDef bar = new BarElementDef();

    private long timestamp = Long.MIN_VALUE;
    private long open = Decimal64Utils.NULL;
    private long close = Decimal64Utils.NULL;
    private long low = Decimal64Utils.NULL;
    private long high = Decimal64Utils.NULL;

    public BboToBarTransformation(String symbol, long periodicity, long startTime, long endTime, ChartType chartType) {
        super(Collections.singletonList(BboPoint.class), Collections.singletonList(BarElementDef.class));

        this.periodicity = periodicity;
        this.startTime = startTime;
        this.endTime = endTime;
        this.chartType = chartType;
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof FeedStatusMessage) {
            FeedStatusMessage feedStatus = (FeedStatusMessage) message;
            if (feedStatus.getStatus() == FeedStatus.NOT_AVAILABLE) {
                timestamp = Long.MIN_VALUE;
            }
        }

        if (message instanceof SnapshotMessage) {
            if (this.timestamp != Long.MIN_VALUE) {
                send();
            }
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(BboPoint point) {
        flush(point.getTimeStampMs());

        if (point.getAskPrice() != Decimal64Utils.NULL && point.getBidPrice() != Decimal64Utils.NULL) {
            update(
                point.getTimeStampMs(), calcValue(point.getAskPrice(), point.getBidPrice())
            );
        }
    }

    private long calcValue(long ask, long bid) {
        switch (chartType) {
            case BARS:
                return Decimal64Utils.divide(Decimal64Utils.add(ask, bid), Decimal64Utils.TWO);
            case BARS_ASK:
                return ask;
            case BARS_BID:
                return bid;
            default:
                throw new RuntimeException("Invalid bars type: " + chartType);
        }
    }

    private void update(long timestamp, long value) {
        if (timestamp < startTime || timestamp > endTime) {
            return;
        }

        if (this.timestamp == Long.MIN_VALUE) {
            this.timestamp = getTransformationTimestamp(timestamp, periodicity);
        }

        if (this.open == Decimal64Utils.NULL) {
            open = close = low = high = value;
        } else {
            if (Decimal64Utils.isGreater(value, high)) {
                high = value;
            }
            if (Decimal64Utils.isLess(value, low)) {
                low = value;
            }
            close = value;
        }
    }

    private boolean flush(long timestamp) {
        if (this.timestamp == Long.MIN_VALUE || timestamp <= this.timestamp) {
            return false;
        }

        // send bars when wasn't data in stream
        while (timestamp - this.timestamp > periodicity) {
            send();
            clear(this.timestamp + 1);
        }

        send();
        clear(timestamp);
        return true;
    }

    private void send() {
        if (timestamp != Long.MIN_VALUE) {
            bar.setTime(timestamp);
            bar.setOpen(Decimal64Utils.toString(open));
            bar.setClose(Decimal64Utils.toString(close));
            bar.setLow(Decimal64Utils.toString(low));
            bar.setHigh(Decimal64Utils.toString(high));
            bar.setVolume("0");

            sendMessage(bar);
        }
    }

    @Override
    public void onComplete() {
        if (timestamp != Long.MIN_VALUE) {
            send();
            clear(timestamp);
        }
        complete();
    }

    private void clear(long timestamp) {
        this.timestamp = getTransformationTimestamp(timestamp, periodicity);
        open = low = high = close;
    }

}
