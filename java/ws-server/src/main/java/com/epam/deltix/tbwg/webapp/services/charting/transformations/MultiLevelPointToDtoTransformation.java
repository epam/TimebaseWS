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
import com.epam.deltix.tbwg.messages.LastMessage;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.OrderBookLinePoint;
import com.epam.deltix.tbwg.webapp.model.charting.line.LinePointDef;
import com.epam.deltix.tbwg.webapp.services.charting.ChartingService;
import com.epam.deltix.timebase.messages.universal.QuoteSide;

import java.util.Arrays;
import java.util.Collections;

/**
 * The transformation removes the same adjacent time series line points and converts to output dto.
 */
public class MultiLevelPointToDtoTransformation extends AbstractChartTransformation<LinePointDef, OrderBookLinePoint> {

    private final int levels;
    private final QuoteSide side;
    private final long startTime;
    private final long endTime;
    private final LinePointDef linePoint = new LinePointDef();

    private boolean intervalEnded;
    private long lastTimestamp = Long.MIN_VALUE;

    private long lastMessageTimestamp = Long.MIN_VALUE;

    private final boolean[] intervalStarted;
    private final long[] lastPrices;

    public MultiLevelPointToDtoTransformation(int levels, boolean bid, long startTime, long endTime) {
        super(Collections.singletonList(OrderBookLinePoint.class), Collections.singletonList(LinePointDef.class));

        this.levels = levels;
        this.side = bid ? QuoteSide.BID : QuoteSide.ASK;
        this.startTime = startTime;
        this.endTime = endTime;

        this.lastPrices = new long[levels];
        this.intervalStarted = new boolean[levels];
        Arrays.fill(this.lastPrices, Decimal64Utils.NaN);
        Arrays.fill(this.intervalStarted, false);
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof LastMessage) {
            lastMessageTimestamp = ((LastMessage) message).getTimestamp();
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(OrderBookLinePoint point) {
        if (intervalEnded) {
            return;
        }

        int level = point.getLevel();
        if (level < levels && side == point.getSide()) {
            if (!intervalStarted[level]) {
                if (point.getTimeStampMs() >= startTime) {
                    intervalStarted[level] = true;
                    if (lastPrices[level] != Decimal64Utils.NaN) {
                        sendPoint(level, startTime, lastPrices[level]);
                    }
                } else {
                    lastPrices[level] = point.getValue();
                }
            }

            long timestamp = point.getTimeStampMs();
            if (timestamp > endTime) {
                intervalEnded = true;
                return;
            }

            if (!Decimal64Utils.equals(lastPrices[level], point.getValue())) {
                sendPoint(level, timestamp, lastPrices[level] = point.getValue());
            }
        }
    }

    @Override
    protected void onComplete() {
        if (lastTimestamp != Long.MIN_VALUE &&
            lastMessageTimestamp != Long.MIN_VALUE &&
            lastTimestamp < lastMessageTimestamp &&
            endTime < ChartingService.MAX_TIMESTAMP)
        {
            for (int i = 0; i < levels; ++i) {
                sendPoint(i, lastMessageTimestamp, lastPrices[i]);
            }
        }
    }

    private void sendPoint(int level, long timestamp, long value) {
        linePoint.lineId(level);
        linePoint.setTime(timestamp);
        linePoint.setValue(Decimal64Utils.toString(value));
        sendMessage(linePoint);

        lastTimestamp = timestamp;
    }
}
