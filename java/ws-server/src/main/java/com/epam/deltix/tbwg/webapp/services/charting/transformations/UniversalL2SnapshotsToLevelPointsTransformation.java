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
import com.epam.deltix.tbwg.messages.*;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.Arrays;
import java.util.Collections;

/**
 * Same as UniversalL2Transformation, but output book builds using only snapshots, without quoteflow.
 * This is faster then UniversalL2Transformation but requires periodical snaphosts.
 */
public class UniversalL2SnapshotsToLevelPointsTransformation extends AbstractChartTransformation<OrderBookLinePoint, MessageInfo> {

    private final int maxLevels;

    private final OrderBookLinePoint outputPoint = new OrderBookLinePoint();

    private final PeriodicityFilter filter;

    private final L2EntryNew[] tempAskQuotes;
    private final L2EntryNew[] tempBidQuotes;

    private long lastTimestamp = Long.MIN_VALUE;

    public UniversalL2SnapshotsToLevelPointsTransformation(String symbol, int maxLevels, long periodicity) {
        super(Collections.singletonList(MarketMessageInfo.class), Collections.singletonList(OrderBookLinePoint.class));

        this.maxLevels = maxLevels;
        this.tempAskQuotes = new L2EntryNew[maxLevels];
        this.tempBidQuotes = new L2EntryNew[maxLevels];

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
    protected void onNextPoint(MessageInfo marketMessage) {
        if (marketMessage instanceof PackageHeader) {
            PackageHeader message = (PackageHeader) marketMessage;
            lastTimestamp = message.getTimeStampMs();
            if (message.getPackageType() != PackageType.INCREMENTAL_UPDATE) {
                if (filter.test(message)) {
                    flushSnapshot(message.getTimeStampMs(), message);
                }
            }
        }
    }

    private void flushSnapshot(long timestamp, PackageHeader snapshot) {
        if (snapshot == null) {
            return;
        }

        ObjectArrayList<BaseEntryInfo> entries = snapshot.getEntries();
        if (entries != null && !entries.isEmpty()) {
            Arrays.fill(tempAskQuotes, null);
            Arrays.fill(tempBidQuotes, null);
            for (int i = 0; i < entries.size(); i++) {
                BaseEntryInfo entry = entries.get(i);
                if (entry instanceof L2EntryNew) {
                    L2EntryNew l2EntryNew = (L2EntryNew) entry;
                    short level = l2EntryNew.getLevel();
                    if (level >= maxLevels) {
                        continue;
                    }

                    if (l2EntryNew.getSide() == QuoteSide.ASK) {
                        tempAskQuotes[level] = l2EntryNew;
                    } else if (l2EntryNew.getSide() == QuoteSide.BID) {
                        tempBidQuotes[level] = l2EntryNew;
                    }
                }
            }

            for (int i = 0; i < maxLevels; ++i) {
                sendQuote(tempAskQuotes[i], timestamp, i, QuoteSide.ASK);
                sendQuote(tempBidQuotes[i], timestamp, i, QuoteSide.BID);
            }
        }
    }

    private void flushEmptySnapshot(long timestamp) {
        for (int i = 0; i < maxLevels; ++i) {
            sendQuote(null, timestamp, i, QuoteSide.ASK);
            sendQuote(null, timestamp, i, QuoteSide.BID);
        }
    }

    private void sendQuote(L2EntryNew entry, long timestamp, int level, QuoteSide side) {
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

}

