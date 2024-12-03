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

import com.epam.deltix.orderbook.core.api.MarketSide;
import com.epam.deltix.orderbook.core.api.OrderBook;
import com.epam.deltix.orderbook.core.api.OrderBookQuote;
import com.epam.deltix.orderbook.core.impl.L2OrderBookFactory;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.orderbook.core.impl.L3OrderBookFactory;
import com.epam.deltix.orderbook.core.options.OrderBookOptionsBuilder;
import com.epam.deltix.tbwg.messages.BboPoint;
import com.epam.deltix.tbwg.messages.FeedStatusMessage;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.service.FeedStatus;
import com.epam.deltix.timebase.messages.universal.DataModelType;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

/**
 * The transformation filters package headers and leaves only l1 entries.
 */
public class OrderBookToBboTransformation extends BboVolumeTransformation {

    private static final Logger LOGGER = LoggerFactory.getLogger(OrderBookToBboTransformation.class);

    private final OrderBook<OrderBookQuote> book;
    private final ModelDataSourceType sourceType;

    private long bidPrice = Decimal64Utils.NULL;
    private long askPrice = Decimal64Utils.NULL;

    private long lastTimestamp = Long.MIN_VALUE / 2;

    public OrderBookToBboTransformation(ModelDataSourceType sourceType,
                                        final String symbol,
                                        ChartDataSource source,
                                        boolean isSingleSymbolSource) {

        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(BboPoint.class),
                source, symbol, isSingleSymbolSource);

        this.sourceType = sourceType;
        if (sourceType == ModelDataSourceType.L2) {
            this.book = createL2Book();
        } else if (sourceType == ModelDataSourceType.L3) {
            this.book = createL3Book();
        } else {
            throw new IllegalArgumentException("Invalid source type: " + sourceType);
        }
    }

    private OrderBook<OrderBookQuote> createL2Book() {
        return L2OrderBookFactory.newSingleExchangeBook(
            new OrderBookOptionsBuilder()
                .quoteLevels(DataModelType.LEVEL_TWO)
                .initialDepth(10)
                .build()
        );
    }

    private OrderBook<OrderBookQuote> createL3Book() {
        return L3OrderBookFactory.newSingleExchangeBook(
            new OrderBookOptionsBuilder()
                .quoteLevels(DataModelType.LEVEL_THREE)
                .initialDepth(10)
                .build()
        );
    }

    @Override
    protected void onMessage(Message message) {
        if (message instanceof FeedStatusMessage) {
            FeedStatusMessage feedStatus = (FeedStatusMessage) message;
            if (feedStatus.getStatus() == FeedStatus.NOT_AVAILABLE) {
                book.clear();
            }
        }

        sendMessage(message);
    }

    @Override
    protected void onNextPoint(final InstrumentMessage marketMessage) {
        if (marketMessage instanceof PackageHeader && isProcessSymbol()) {
            final PackageHeader message = (PackageHeader) marketMessage;
            final long timestamp = marketMessage.getTimeStampMs();

            sendVolumes(message);

            // todo: filter
            book.update(message);

            MarketSide<OrderBookQuote> askSide = book.getMarketSide(QuoteSide.ASK);
            MarketSide<OrderBookQuote> bidSide = book.getMarketSide(QuoteSide.BID);
            if (!askSide.isEmpty() && !bidSide.isEmpty()) {
                long askPrice = askSide.getBestQuote().getPrice();
                long bidPrice = bidSide.getBestQuote().getPrice();

                if (this.askPrice != askPrice || this.bidPrice != bidPrice || (timestamp - lastTimestamp > 1000)) {
                    this.lastTimestamp = timestamp;
                    this.askPrice = askPrice;
                    this.bidPrice = bidPrice;

                    bboPoint.setTimeStampMs(message.getTimeStampMs());
                    bboPoint.setBidPrice(this.bidPrice);
                    bboPoint.setAskPrice(this.askPrice);
                    sendMessage(bboPoint);
                }
            }
        }
    }

    @Override
    protected void onComplete() {
        super.onComplete();
    }

}