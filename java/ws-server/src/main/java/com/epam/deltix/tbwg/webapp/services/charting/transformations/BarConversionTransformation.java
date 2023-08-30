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

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.webapp.model.charting.line.BarElementDef;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.util.collections.generated.LongToObjectHashMap;

import javax.security.auth.message.MessageInfo;
import java.util.Collections;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;

/**
 * The transformation aggregates bars from another bars and converts into dto.
 */
public class BarConversionTransformation extends AbstractChartTransformation<BarElementDef, InstrumentMessage> {

    private final long periodicity;
    private final long startTime;
    private final long endTime;

    private final LongToObjectHashMap<BarElement> exchangeToBar = new LongToObjectHashMap<>();
    private final BarElementDef bar = new BarElementDef();

    private static class BarElement {
        private final long exchange;

        private long timestamp = Long.MIN_VALUE;
        private long closeBarTimestamp = Long.MIN_VALUE;
        private double open = Double.NaN;
        private double close = Double.NaN;
        private double low = Double.NaN;
        private double high = Double.NaN;
        private double volume = Double.NaN;

        private BarElement(long exchange) {
            this.exchange = exchange;
        }
    }

    public BarConversionTransformation(long aggregation, long startTime, long endTime) {
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
    protected void onNextPoint(InstrumentMessage message) {
        long barTimestamp = message.getTimeStampMs();

        if (barTimestamp < startTime) {
            return;
        }

        BarMessage barMessage = (message instanceof BarMessage) ? (BarMessage)message : null;

        if (barMessage == null)
            return;

        BarElement barElement = exchangeToBar.get(barMessage.getExchangeId(), null);
        if (barElement == null) {
            exchangeToBar.put(barMessage.getExchangeId(), barElement = new BarElement(barMessage.getExchangeId()));
        }

        flushPrev(barElement, barTimestamp);

        if (barTimestamp > endTime) {
            return;
        }

        if (barElement.timestamp == Long.MIN_VALUE) {
            barElement.timestamp = getTransformationTimestamp(barTimestamp, periodicity);
            barElement.closeBarTimestamp = getTransformationStopBarTimestamp(barTimestamp, periodicity);
            barElement.open = barMessage.getOpen();
            barElement.close = barMessage.getClose();
            barElement.high = barMessage.getHigh();
            barElement.low = barMessage.getLow();
            barElement.volume = barMessage.getVolume();
        } else {
            if (Double.isNaN(barElement.open)) {
                barElement.open = barMessage.getOpen();
            }
            barElement.close = (Double.isNaN(barMessage.getClose()) ? barElement.close : barMessage.getClose());
            barElement.high = (Double.isNaN(barMessage.getHigh()) ? barElement.high : Math.max(barMessage.getHigh(), barElement.high));
            barElement.low = (Double.isNaN(barMessage.getLow()) ? barElement.low : Math.min(barMessage.getLow(), barElement.low));
            barElement.volume += (Double.isNaN(barMessage.getVolume()) ? 0.0f : barMessage.getVolume());
        }
    }

    @Override
    public void onComplete() {
        exchangeToBar.forEach(barElement -> {
            if (barElement.timestamp != Long.MIN_VALUE) {
                send(barElement);
                clear(barElement);
            }
        });
        complete();
    }

    private void flushPrev(BarElement barElement, long timestamp) {
        if (barElement.timestamp == Long.MIN_VALUE) {
            return;
        }

        if (timestamp <= barElement.closeBarTimestamp) {
            return;
        }

        send(barElement);
        clear(barElement);
    }

    private void send(BarElement barElement) {
        bar.setTime(barElement.timestamp);
        bar.setOpen(Decimal64Utils.toString(Decimal64Utils.fromDouble(barElement.open)));
        bar.setClose(Decimal64Utils.toString(Decimal64Utils.fromDouble(barElement.close)));
        bar.setLow(Decimal64Utils.toString(Decimal64Utils.fromDouble(barElement.low)));
        bar.setHigh(Decimal64Utils.toString(Decimal64Utils.fromDouble(barElement.high)));
        bar.setVolume(Decimal64Utils.toString(Decimal64Utils.fromDouble(barElement.volume)));
        bar.setExchange(AlphanumericUtils.isValidAlphanumeric(barElement.exchange) ?
                AlphanumericUtils.toString(barElement.exchange) : null);

        sendMessage(bar);
    }

    private void clear(BarElement barElement) {
        barElement.timestamp = Long.MIN_VALUE;
        barElement.open = Double.NaN;
        barElement.close = Double.NaN;
        barElement.low = Double.NaN;
        barElement.high = Double.NaN;
        barElement.volume = Double.NaN;
    }

}
