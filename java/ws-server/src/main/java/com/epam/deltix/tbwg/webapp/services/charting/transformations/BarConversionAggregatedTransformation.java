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
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.webapp.model.charting.line.BarElementDef;

import java.util.Collections;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;

/**
 * The transformation aggregates bars from another bars and converts into dto.
 */
public class BarConversionAggregatedTransformation extends AbstractChartTransformation<BarElementDef, BarMessage> {

    private final long periodicity;
    private final long startTime;
    private final long endTime;
    private final BarElementDef bar = new BarElementDef();

    private long timestamp = Long.MIN_VALUE;
    private double open = Double.NaN;
    private double close = Double.NaN;
    private double low = Double.NaN;
    private double high = Double.NaN;
    private double volume = Double.NaN;
    private boolean aggregated = false;

    public BarConversionAggregatedTransformation(long aggregation, long startTime, long endTime) {
        super(Collections.singletonList(BarMessage.class), Collections.singletonList(BarElementDef.class));

        this.periodicity = aggregation;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(BarMessage barMessage) {
        long barTimestamp = barMessage.getTimeStampMs();
        if (barTimestamp < startTime) {
            return;
        }

        flushPrev(barTimestamp);

        if (barTimestamp > endTime) {
            return;
        }

        if (this.timestamp == Long.MIN_VALUE) {
            this.aggregated = false;
            this.timestamp = getTransformationTimestamp(barTimestamp, periodicity);
            this.open = barMessage.getOpen();
            this.close = barMessage.getClose();
            this.high = barMessage.getHigh();
            this.low = barMessage.getLow();
            this.volume = barMessage.getVolume();
        } else {
            if (!this.aggregated) {
                this.aggregated = true;
                this.timestamp = (barTimestamp / periodicity) * periodicity + periodicity;
            }
            this.close = barMessage.getClose();
            this.high = Math.max(barMessage.getHigh(), high);
            this.low = Math.min(barMessage.getLow(), low);
            this.volume += barMessage.getVolume();
        }
    }

    @Override
    public void onComplete() {
        if (timestamp != Long.MIN_VALUE) {
            send();
            clear();
        }
        complete();
    }

    private void flushPrev(long timestamp) {
        if (this.timestamp == Long.MIN_VALUE) {
            return;
        }

        if (aggregated) {
            if (timestamp <= this.timestamp) {
                return;
            }
        } else if (timestamp < this.timestamp) {
            return;
        }

        send();
        clear();
    }

    private void send() {
        bar.setTime(aggregated ? timestamp : (timestamp - periodicity));
        bar.setOpen(Decimal64Utils.toString(Decimal64Utils.fromDouble(open)));
        bar.setClose(Decimal64Utils.toString(Decimal64Utils.fromDouble(close)));
        bar.setLow(Decimal64Utils.toString(Decimal64Utils.fromDouble(low)));
        bar.setHigh(Decimal64Utils.toString(Decimal64Utils.fromDouble(high)));
        bar.setVolume(Decimal64Utils.toString(Decimal64Utils.fromDouble(volume)));

        sendMessage(bar);
    }

    private void clear() {
        timestamp = Long.MIN_VALUE;
        open = Double.NaN;
        close = Double.NaN;
        low = Double.NaN;
        high = Double.NaN;
        volume = Double.NaN;
    }

}
