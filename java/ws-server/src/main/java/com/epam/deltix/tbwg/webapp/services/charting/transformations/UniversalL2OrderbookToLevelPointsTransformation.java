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
import com.epam.deltix.orderbook.core.api.*;
import com.epam.deltix.orderbook.core.impl.L2OrderBookFactory;
import com.epam.deltix.orderbook.core.options.OrderBookOptionsBuilder;
import com.epam.deltix.orderbook.core.options.OrderBookType;
import com.epam.deltix.orderbook.core.options.UpdateMode;
import com.epam.deltix.tbwg.messages.*;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

/**
 * The transformation builds quoteflow order book for instrument and sends snapshots with specified periodicity and max level.
 * The output messages are time series line points for each side and level of book.
 */
public class UniversalL2OrderbookToLevelPointsTransformation extends AbstractChartTransformation<OrderBookLinePoint, MessageInfo> {

    private static final Logger LOGGER = LoggerFactory.getLogger(UniversalL2OrderbookToBboTransformation.class);

    private final OrderBook<OrderBookQuote> book;
    private final int maxLevels;

    private final OrderBookLinePoint outputPoint = new OrderBookLinePoint();
    private final PeriodicityFilter filter;

    private long lastTimestamp = Long.MIN_VALUE;
    private boolean snapshotInitialized;

    public UniversalL2OrderbookToLevelPointsTransformation(String symbol, int maxLevels, long periodicity) {
        super(Collections.singletonList(MarketMessageInfo.class), Collections.singletonList(OrderBookLinePoint.class));

        this.book = OrderBookFactory.create(
            new OrderBookOptionsBuilder()
                .symbol(symbol)
                .orderBookType(OrderBookType.SINGLE_EXCHANGE)
                .updateMode(UpdateMode.WAITING_FOR_SNAPSHOT)
                .quoteLevels(DataModelType.LEVEL_TWO)
                .build()
        );
        this.maxLevels = maxLevels;
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
                book.clear();
                flushMessages(feedStatus.getTimestamp());
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
                snapshotInitialized = true;
            }

            if (snapshotInitialized) {
                book.update(message);
                if (filter.test(message)) {
                    flushMessages(message.getTimeStampMs());
                }
            }
        }
    }


    private PackageHeaderInfo createPackageHeader(long exchangeId) {
        PackageHeader packageHeader = new PackageHeader();
        packageHeader.setPackageType(PackageType.VENDOR_SNAPSHOT);

        ObjectArrayList<BaseEntryInfo> entries = new ObjectArrayList<>();
        entries.add(createBookResetEntry(exchangeId, QuoteSide.BID));
        entries.add(createBookResetEntry(exchangeId, QuoteSide.ASK));
        packageHeader.setEntries(entries);

        return packageHeader;
    }

    private BookResetEntry createBookResetEntry(long exchangeId, QuoteSide side) {
        BookResetEntry resetEntry = new BookResetEntry();
        resetEntry.setSide(side);
        resetEntry.setModelType(book.getQuoteLevels());
        resetEntry.setExchangeId(exchangeId);

        return resetEntry;
    }

    private void flushMessages(long timestamp) {
        sendQuotes(book.getMarketSide(QuoteSide.ASK), timestamp);
        sendQuotes(book.getMarketSide(QuoteSide.BID), timestamp);
    }

    private void sendQuotes(final MarketSide<OrderBookQuote> marketSide, long timestamp) {
        int level = 0;
        for (; level < marketSide.depth(); ++level) {
            if (level >= maxLevels) {
                break;
            }

            if (marketSide.hasLevel((short) level)){
                final OrderBookQuote quote = marketSide.getQuote(level);
                sendQuote(timestamp, level, marketSide.getSide(), quote.getPrice(), quote.getSize());
            }
        }

        for (; level < maxLevels; ++level) {
            sendQuote(timestamp, level, marketSide.getSide(), Decimal64Utils.NaN, Decimal64Utils.NaN);
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
