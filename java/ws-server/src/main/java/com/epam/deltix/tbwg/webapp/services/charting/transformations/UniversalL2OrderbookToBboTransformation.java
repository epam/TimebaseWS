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

import com.epam.deltix.common.orderbook.MarketSide;
import com.epam.deltix.common.orderbook.OrderBook;
import com.epam.deltix.common.orderbook.OrderBookQuote;
import com.epam.deltix.common.orderbook.impl.OrderBookFactory;
import com.epam.deltix.common.orderbook.options.OrderBookOptionsBuilder;
import com.epam.deltix.common.orderbook.options.OrderBookType;
import com.epam.deltix.common.orderbook.options.UpdateMode;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.tbwg.messages.BboPoint;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.universal.DataModelType;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;

/**
 * The transformation filters package headers and leaves only l1 entries.
 */
public class UniversalL2OrderbookToBboTransformation extends AbstractChartTransformation<BboPoint, MessageInfo> {

    private static final Logger LOGGER = LoggerFactory.getLogger(UniversalL2OrderbookToBboTransformation.class);

    private final BboPoint bboPoint = new BboPoint();
    private final OrderBook<OrderBookQuote> book;

    private long bidPrice = Decimal64Utils.NULL;
    private long askPrice = Decimal64Utils.NULL;

    private long lastTimestamp = Long.MIN_VALUE / 2;

    public UniversalL2OrderbookToBboTransformation(final String symbol) {
        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(BboPoint.class));
        this.book = OrderBookFactory.create(
            new OrderBookOptionsBuilder()
                .symbol(symbol)
                .orderBookType(OrderBookType.SINGLE_EXCHANGE)
                .updateMode(UpdateMode.WAITING_FOR_SNAPSHOT)
                .quoteLevels(DataModelType.LEVEL_TWO)
                .build()
        );
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(final MessageInfo marketMessage) {
        if (marketMessage instanceof PackageHeader) {
            final PackageHeader message = (PackageHeader) marketMessage;
            final long timestamp = marketMessage.getTimeStampMs();

            // todo: filter
            book.update((PackageHeader) marketMessage);

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
