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
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.Collections;

/**
 * The transformation filters package headers and leaves only l1 entries.
 */
public class SnapshotToBboTransformation extends BboVolumeTransformation {

    private long bidPrice = Decimal64Utils.NULL;
    private long askPrice = Decimal64Utils.NULL;

    private long lastTimestamp = Long.MIN_VALUE / 2;

    private final ModelDataSourceType sourceType;

    public SnapshotToBboTransformation(ModelDataSourceType sourceType, String symbol, ChartDataSource source, boolean isSingleSymbolSource) {
        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(BboPoint.class),
                source, symbol, isSingleSymbolSource);

        this.sourceType = sourceType;
        if (sourceType != ModelDataSourceType.L2 && sourceType != ModelDataSourceType.L3) {
            throw new IllegalArgumentException("Invalid source type: " + sourceType);
        }
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(InstrumentMessage marketMessage) {
        if (marketMessage instanceof PackageHeader && isProcessSymbol()) {
            PackageHeader message = (PackageHeader) marketMessage;

            sendVolumes(message);

            if (message.getPackageType() != PackageType.INCREMENTAL_UPDATE && message.getEntries() != null) {
                if (sourceType == ModelDataSourceType.L2) {
                    extractBboFromL2Snapshot(message);
                } else if (sourceType == ModelDataSourceType.L3) {
                    extractBboFromL3Snapshot(message);
                }

                flush();
            }
        }
    }

    private void extractBboFromL2Snapshot(PackageHeader message) {
        message.getEntries().forEach(entry -> {
            if (entry instanceof L2EntryNew) {
                L2EntryNew newEntry = (L2EntryNew) entry;
                if (newEntry.getLevel() == 0) {
                    updateSide(message.getTimeStampMs(), newEntry.getPrice(), newEntry.getSide());
                }
            }
        });
    }

    private void extractBboFromL3Snapshot(PackageHeader message) {
        QuoteSide currentSide = null;
        ObjectArrayList<BaseEntryInfo> entries = message.getEntries();
        for (int i = 0; i < entries.size(); i++) {
            BaseEntryInfo entry = entries.get(i);
            if (entry instanceof L3EntryNew) {
                L3EntryNew l3Entry = (L3EntryNew) entry;
                QuoteSide side = l3Entry.getSide();
                if (currentSide != side && side != null) {
                    currentSide = side;
                    updateSide(message.getTimeStampMs(), l3Entry.getPrice(), currentSide);
                }
            }
        }
    }

    private void flush() {
        long timestamp = bboPoint.getTimeStampMs();
        long askPrice = bboPoint.getAskPrice();
        long bidPrice = bboPoint.getBidPrice();
        if (askPrice != Decimal64Utils.NULL && bidPrice != Decimal64Utils.NULL) {
            if (this.askPrice != askPrice || this.bidPrice != bidPrice || (timestamp - lastTimestamp > 1000)) {
                this.askPrice = askPrice;
                this.bidPrice = bidPrice;
                sendMessage(bboPoint);
            }

            clean();
        }
    }

    private void updateSide(long timestamp, long price, QuoteSide side) {
        if (side == QuoteSide.ASK) {
            bboPoint.setTimeStampMs(timestamp);
            bboPoint.setAskPrice(price);
        } else if (side == QuoteSide.BID) {
            bboPoint.setTimeStampMs(timestamp);
            bboPoint.setBidPrice(price);
        }
    }

    private void clean() {
        bboPoint.setBidPrice(Decimal64Utils.NULL);
        bboPoint.setAskPrice(Decimal64Utils.NULL);
    }
}