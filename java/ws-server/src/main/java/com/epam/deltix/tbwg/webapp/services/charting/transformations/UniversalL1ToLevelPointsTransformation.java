/*
 * Copyright 2024 EPAM Systems, Inc
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
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.OrderBookLinePoint;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.L1Entry;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.timebase.messages.universal.QuoteSide;

import java.util.Collections;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 *
 */
public class UniversalL1ToLevelPointsTransformation extends SymbolFilterChartTransformation<BboPoint, InstrumentMessage> {

    private final OrderBookLinePoint outputPoint = new OrderBookLinePoint();

    private long bidPrice = Decimal64Utils.NULL;
    private long askPrice = Decimal64Utils.NULL;

    private final AtomicBoolean hasL1 = new AtomicBoolean();

    private final PeriodicityFilter filter;

    public UniversalL1ToLevelPointsTransformation(String symbol, long periodicity, ChartDataSource source, boolean isSingleSymbolSource) {
        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(BboPoint.class),
                source, symbol, isSingleSymbolSource);
        this.filter = new PeriodicityFilter(periodicity, true);
        clean();
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof FeedStatusMessage) {
            FeedStatusMessage feedStatus = (FeedStatusMessage) message;
            if (feedStatus.getStatus() == FeedStatus.NOT_AVAILABLE) {
                filter.refresh();
                flushNanPoints(feedStatus);
            }
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(InstrumentMessage marketMessage) {
        if (marketMessage instanceof PackageHeader && isProcessSymbol()) {
            PackageHeader message = (PackageHeader) marketMessage;

            message.getEntries().forEach(entry -> {
                if (entry instanceof L1Entry) {
                    L1Entry l1Entry = (L1Entry) entry;
                    updateSide(l1Entry.getPrice(), l1Entry.getSide());
                    hasL1.set(true);
                }
            });

            if (hasL1.get() && filter.test(message)) {
                flush(message.getTimeStampMs());
                hasL1.set(false);
            }
        }
    }

    private void updateSide(long price, QuoteSide side) {
        if (side == QuoteSide.ASK) {
            askPrice = price;
        } else if (side == QuoteSide.BID) {
            bidPrice = price;
        }
    }

    private void flush(long timestamp) {
        if (askPrice != Decimal64Utils.NULL) {
            flushPoint(timestamp, QuoteSide.ASK, askPrice);
        }
        if (bidPrice != Decimal64Utils.NULL) {
            flushPoint(timestamp, QuoteSide.BID, bidPrice);
        }
        clean();
    }

    private void flushPoint(long timestamp, QuoteSide side, long price) {
        outputPoint.setTimeStampMs(timestamp);
        outputPoint.setLevel(0);
        outputPoint.setSide(side);
        outputPoint.setValue(price);
        sendMessage(outputPoint);
    }

    private void flushNanPoints(FeedStatusMessage feedStatus) {
        flushPoint(feedStatus.getTimestamp(), QuoteSide.ASK, Decimal64Utils.NaN);
        flushPoint(feedStatus.getTimestamp(), QuoteSide.BID, Decimal64Utils.NaN);
        clean();
    }

    private void clean() {
        askPrice = Decimal64Utils.NULL;
        bidPrice = Decimal64Utils.NULL;
    }


}