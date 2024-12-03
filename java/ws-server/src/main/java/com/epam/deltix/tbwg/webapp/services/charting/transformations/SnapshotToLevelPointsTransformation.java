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
import com.epam.deltix.tbwg.messages.*;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.Arrays;
import java.util.Collections;

/**
 * Same as UniversalL2Transformation, but output book builds using only snapshots, without quoteflow.
 * This is faster than UniversalL2Transformation but requires periodical snaphosts.
 */
public class SnapshotToLevelPointsTransformation extends SymbolFilterChartTransformation<OrderBookLinePoint, InstrumentMessage> {

    private final int maxLevels;

    private final OrderBookLinePoint outputPoint = new OrderBookLinePoint();

    private final PeriodicityFilter filter;

    private final BasePriceEntry[] tempAskQuotes;
    private final BasePriceEntry[] tempBidQuotes;

    private ModelDataSourceType sourceType;

    private long lastTimestamp = Long.MIN_VALUE;

    public SnapshotToLevelPointsTransformation(String symbol,
                                                int maxLevels,
                                                long periodicity,
                                                ChartDataSource source,
                                                boolean isSingleSymbolSource) {
        this(null, symbol, maxLevels, periodicity, source, isSingleSymbolSource);
    }

    public SnapshotToLevelPointsTransformation(ModelDataSourceType sourceType,
                                               String symbol,
                                               int maxLevels,
                                               long periodicity,
                                               ChartDataSource source,
                                               boolean isSingleSymbolSource) {

        super(Collections.singletonList(InstrumentMessage.class), Collections.singletonList(OrderBookLinePoint.class),
                source, symbol, isSingleSymbolSource);

        this.sourceType = sourceType;
        this.maxLevels = maxLevels;
        this.tempAskQuotes = new BasePriceEntry[maxLevels];
        this.tempBidQuotes = new BasePriceEntry[maxLevels];

        this.filter = new PeriodicityFilter(periodicity, true);

        this.outputPoint.setSymbol(symbol);
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof ChangePeriodicity) {
            filter.setPeriodicity(((ChangePeriodicity) message).getPeriodicity());
        } else if (message instanceof FeedStatusMessage) {
            FeedStatusMessage feedStatus = (FeedStatusMessage) message;
            if (feedStatus.getStatus() == FeedStatus.NOT_AVAILABLE) {
                filter.refresh();
                flushEmptySnapshot(feedStatus.getTimestamp());
            }
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(InstrumentMessage marketMessage) {
        if (marketMessage instanceof PackageHeader && isProcessSymbol()) {
            PackageHeader message = (PackageHeader) marketMessage;
            lastTimestamp = message.getTimeStampMs();
            if (message.getPackageType() != PackageType.INCREMENTAL_UPDATE) {
                if (filter.test(message)) {
                    sendSnapshot(message.getTimeStampMs(), message);
                }
            }
        }
    }

    private void sendSnapshot(long timestamp, PackageHeader snapshot) {
        if (snapshot == null) {
            return;
        }

        ObjectArrayList<BaseEntryInfo> entries = snapshot.getEntries();
        if (entries != null && !entries.isEmpty()) {
            Arrays.fill(tempAskQuotes, null);
            Arrays.fill(tempBidQuotes, null);

            ModelDataSourceType sourceType = sourceType(snapshot);
            if (sourceType == ModelDataSourceType.L2) {
                extractL2Quotes(entries);
            } else if (sourceType == ModelDataSourceType.L3) {
                extractL3Quotes(entries);
            } else {
                return;
            }

            for (int i = 0; i < maxLevels; ++i) {
                sendQuote(tempAskQuotes[i], timestamp, i, QuoteSide.ASK);
                sendQuote(tempBidQuotes[i], timestamp, i, QuoteSide.BID);
            }
        }
    }

    private void extractL2Quotes(ObjectArrayList<BaseEntryInfo> entries) {
        for (int i = 0; i < entries.size(); i++) {
            BaseEntryInfo entry = entries.get(i);
            if (entry instanceof L2EntryNew) {
                L2EntryNew l2Entry = (L2EntryNew) entry;
                short level = l2Entry.getLevel();
                if (level >= maxLevels) {
                    continue;
                }

                if (l2Entry.getSide() == QuoteSide.ASK) {
                    tempAskQuotes[level] = l2Entry;
                } else if (l2Entry.getSide() == QuoteSide.BID) {
                    tempBidQuotes[level] = l2Entry;
                }
            }
        }
    }

    private void extractL3Quotes(ObjectArrayList<BaseEntryInfo> entries) {
        QuoteSide currentSide = null;
        int sidePosition = 0;
        for (int i = 0; i < entries.size(); i++) {
            BaseEntryInfo entry = entries.get(i);
            if (entry instanceof L3EntryNew) {
                L3EntryNew l3Entry = (L3EntryNew) entry;

                sidePosition++;
                QuoteSide side = l3Entry.getSide();
                if (currentSide != side) {
                    currentSide = side;
                    sidePosition = 0;
                }

                if (sidePosition >= maxLevels) {
                    continue;
                }

                if (currentSide == QuoteSide.ASK) {
                    tempAskQuotes[sidePosition] = l3Entry;
                } else if (currentSide == QuoteSide.BID) {
                    tempBidQuotes[sidePosition] = l3Entry;
                }
            }
        }
    }

    private void flushEmptySnapshot(long timestamp) {
        for (int i = 0; i < maxLevels; ++i) {
            sendQuote(null, timestamp, i, QuoteSide.ASK);
            sendQuote(null, timestamp, i, QuoteSide.BID);
        }
    }

    private void sendQuote(BasePriceEntry entry, long timestamp, int level, QuoteSide side) {
        if (entry != null) {
            sendQuote(timestamp, level, side, entry.getPrice(), entry.getSize());
        } else {
            sendQuote(timestamp, level, side, Decimal64Utils.NaN, Decimal64Utils.NaN);
        }
    }

    private void sendQuote(long timestamp, int level, QuoteSide side, long price, long size) {
        outputPoint.setTimeStampMs(timestamp);
        outputPoint.setLevel(level);
        outputPoint.setSide(side);
        outputPoint.setValue(price);
        outputPoint.setVolume(size);
        sendMessage(outputPoint);
    }

    @Override
    protected void onComplete() {
        sendMessage(new LastMessage(lastTimestamp));
        super.onComplete();
    }

    private ModelDataSourceType sourceType(PackageHeader message) {
        if (sourceType != null) {
            return sourceType;
        }

        if (TransformationUtils.isL2Book(message)) {
            return sourceType = ModelDataSourceType.L2;
        } else if (TransformationUtils.isL3Book(message)) {
            return sourceType = ModelDataSourceType.L3;
        }

        return null;
    }

}