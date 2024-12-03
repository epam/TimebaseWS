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
import com.epam.deltix.orderbook.core.api.MarketSide;
import com.epam.deltix.orderbook.core.api.OrderBook;
import com.epam.deltix.orderbook.core.api.OrderBookQuote;
import com.epam.deltix.orderbook.core.impl.L2OrderBookFactory;
import com.epam.deltix.orderbook.core.impl.L3OrderBookFactory;
import com.epam.deltix.orderbook.core.options.OrderBookOptionsBuilder;
import com.epam.deltix.tbwg.messages.*;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

/**
 * The transformation builds quoteflow order book for instrument and sends snapshots with specified periodicity and max level.
 * The output messages are time series line points for each side and level of book.
 */
public class OrderBookToLevelPointsTransformation extends SymbolFilterChartTransformation<OrderBookLinePoint, InstrumentMessage> {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrderBookToBboTransformation.class);

    private OrderBook<OrderBookQuote> book;
    private ModelDataSourceType sourceType;
    private final int maxLevels;

    private final OrderBookLinePoint outputPoint = new OrderBookLinePoint();
    private final PeriodicityFilter filter;

    private long lastTimestamp = Long.MIN_VALUE;
    private boolean snapshotInitialized;

    public OrderBookToLevelPointsTransformation(String symbol,
                                                int maxLevels,
                                                long periodicity,
                                                ChartDataSource source,
                                                boolean isSingleSymbolSource) {
        this(null, symbol, maxLevels, periodicity, source, isSingleSymbolSource);
    }

    public OrderBookToLevelPointsTransformation(ModelDataSourceType sourceType,
                                                String symbol,
                                                int maxLevels,
                                                long periodicity,
                                                ChartDataSource source,
                                                boolean isSingleSymbolSource) {

        super(Collections.singletonList(InstrumentMessage.class), Collections.singletonList(OrderBookLinePoint.class),
                source, symbol, isSingleSymbolSource);

        this.sourceType = sourceType;
        this.maxLevels = maxLevels;
        this.filter = new PeriodicityFilter(periodicity, true);
        this.outputPoint.setSymbol(symbol);

        if (sourceType == ModelDataSourceType.L2) {
            this.book = createL2Book();
        } else if (sourceType == ModelDataSourceType.L3) {
            this.book = createL3Book();
        } else if (sourceType == ModelDataSourceType.L1) {
            throw new IllegalArgumentException("Invalid source type: " + sourceType);
        }
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof ChangePeriodicity) {
            filter.setPeriodicity(((ChangePeriodicity) message).getPeriodicity());
        } else if (message instanceof FeedStatusMessage) {
            FeedStatusMessage feedStatus = (FeedStatusMessage) message;
            if (feedStatus.getStatus() == FeedStatus.NOT_AVAILABLE) {
                filter.refresh();
                clearBook();
                sendBook(feedStatus.getTimestamp());
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
                snapshotInitialized = true;
            }

            if (snapshotInitialized) {
                OrderBook<OrderBookQuote> book = getOrCreateBook(message);
                if (book != null) {
                    book.update(message);
                    if (filter.test(message)) {
                        sendBook(message.getTimeStampMs());
                    }
                }
            }
        }
    }

    private void sendBook(long timestamp) {
        if (book != null) {
            sendSide(book.getMarketSide(QuoteSide.ASK), timestamp);
            sendSide(book.getMarketSide(QuoteSide.BID), timestamp);
        }
    }

    private void sendSide(final MarketSide<OrderBookQuote> marketSide, long timestamp) {
        int level = 0;
        for (OrderBookQuote quote : marketSide) {
            if (level >= maxLevels) {
                break;
            }

            if (quote != null) {
                sendQuote(timestamp, level, marketSide.getSide(), quote.getPrice(), quote.getSize());
            } else {
                sendQuote(timestamp, level, marketSide.getSide(), Decimal64Utils.NaN, Decimal64Utils.NaN);
            }

            level++;
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


    private OrderBook<OrderBookQuote> getOrCreateBook(PackageHeader message) {
        if (book != null) {
            return book;
        }

        if (TransformationUtils.isL2Book(message)) {
            sourceType = ModelDataSourceType.L2;
            return book = createL2Book();
        } else if (TransformationUtils.isL3Book(message)) {
            sourceType = ModelDataSourceType.L3;
            return book = createL3Book();
        }

        return null;
    }

    private OrderBook<OrderBookQuote> createL2Book() {
        return L2OrderBookFactory.newSingleExchangeBook(
            new OrderBookOptionsBuilder()
                .quoteLevels(DataModelType.LEVEL_TWO)
                .initialDepth(maxLevels)
                .build()
        );
    }

    private OrderBook<OrderBookQuote> createL3Book() {
        return L3OrderBookFactory.newSingleExchangeBook(
            new OrderBookOptionsBuilder()
                .quoteLevels(DataModelType.LEVEL_THREE)
                .initialDepth(maxLevels)
                .build()
        );
    }

    private void clearBook() {
        if (book != null) {
            book.clear();
        }
    }

}