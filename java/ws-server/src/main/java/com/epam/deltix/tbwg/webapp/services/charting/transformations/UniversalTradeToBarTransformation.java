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
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.messages.FeedStatusMessage;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.SnapshotMessage;
import com.epam.deltix.tbwg.webapp.model.charting.line.BarElementDef;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.Collections;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.getTransformationTimestamp;

/**
 *
 */
public class UniversalTradeToBarTransformation extends SymbolFilterChartTransformation<BarMessage, InstrumentMessage> {

    private final long periodicity;
    private final long startTime;
    private final long endTime;
    private final BarElementDef bar = new BarElementDef();

    private long timestamp = Long.MIN_VALUE;
    private long open = Decimal64Utils.NULL;
    private long close = Decimal64Utils.NULL;
    private long low = Decimal64Utils.NULL;
    private long high = Decimal64Utils.NULL;
    private long volume = Decimal64Utils.ZERO;

    public UniversalTradeToBarTransformation(String symbol, ChartDataSource source, long periodicity, long startTime, long endTime, boolean isSingleSymbolSource) {
        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(BarMessage.class),
                source, symbol, isSingleSymbolSource);
        this.periodicity = periodicity;
        this.startTime = startTime;
        this.endTime = endTime;
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
    protected void onNextPoint(InstrumentMessage marketMessage) {
        if (marketMessage instanceof PackageHeader && isProcessSymbol()) {
            PackageHeader message = (PackageHeader) marketMessage;

            ObjectArrayList<BaseEntryInfo> entries = message.getEntries();
            if (entries != null && entries.size() > 0) {
                for (BaseEntryInfo entry : entries) {
                    if (entry instanceof TradeEntryInfo) {
                        TradeEntryInfo tradeEntryInfo = (TradeEntryInfo) entry;
                        update(message.getTimeStampMs(), tradeEntryInfo);
                        break;
                    }
                }
            }

            flush(message.getTimeStampMs());
        }
    }

    private void update(long timestamp, TradeEntryInfo entry) {
        if (timestamp < startTime || timestamp > endTime) {
            return;
        }

        if (this.timestamp == Long.MIN_VALUE) {
            this.timestamp = getTransformationTimestamp(timestamp, periodicity);
        }

        long price = entry.getPrice();
        if (this.open == Decimal64Utils.NULL) {
            open = close = low = high = price;
        } else {
            if (Decimal64Utils.isGreater(price, high)) {
                high = price;
            }
            if (Decimal64Utils.isLess(price, low)) {
                low = price;
            }
            close = price;
        }
        long size = entry.getSize();
        long volume = (Decimal64Utils.isNull(size) || Decimal64Utils.isNaN(size)) ? Decimal64Utils.ZERO : size;
        this.volume = Decimal64Utils.add(this.volume, volume);
    }

    private void flush(long timestamp) {
        if (this.timestamp == Long.MIN_VALUE || timestamp <= this.timestamp) {
            return;
        }

        // send bars when wasn't data in stream
        while (timestamp - this.timestamp > periodicity) {
            send();
            clear(this.timestamp + 1);
        }

        send();
        clear(timestamp);
    }

    private void send() {
        if (timestamp != Long.MIN_VALUE) {
            bar.setTime(timestamp);
            bar.setOpen(Decimal64Utils.toFloatString(open));
            bar.setClose(Decimal64Utils.toFloatString(close));
            bar.setLow(Decimal64Utils.toFloatString(low));
            bar.setHigh(Decimal64Utils.toFloatString(high));
            bar.setVolume(Decimal64Utils.toFloatString(volume));

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
        volume = Decimal64Utils.ZERO;
    }
}