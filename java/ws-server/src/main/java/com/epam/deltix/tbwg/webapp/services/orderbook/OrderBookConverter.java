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
package com.epam.deltix.tbwg.webapp.services.orderbook;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.orderbook.core.api.MarketSide;
import com.epam.deltix.orderbook.core.api.OrderBook;
import com.epam.deltix.orderbook.core.api.OrderBookQuote;
import com.epam.deltix.tbwg.webapp.model.orderbook.*;

import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class OrderBookConverter {

    public OrderBookConverter() {
    }

    public L2PackageDto convertExchange(long timestamp, String symbol, OrderBook<OrderBookQuote> book) {
        L2PackageDto packageDto = new L2PackageDto();
        packageDto.timestamp = timestamp;
        packageDto.setSecurityId(symbol);
        packageDto.type = createL2PackageType(PackageType.PERIODICAL_SNAPSHOT);
        packageDto.entries = convertExchange(book);
        return packageDto;
    }

    private List<L2EntryDto> convertExchange(OrderBook<OrderBookQuote> book) {
        List<L2EntryDto> entries = new ArrayList<>();
        Arrays.asList(new QuoteSide[]{ QuoteSide.ASK, QuoteSide.BID }).forEach(quoteSide -> {
            MarketSide<OrderBookQuote> side = book.getMarketSide(quoteSide);
            for (short i = 0; i < side.depth(); ++i) {
                entries.add(convertQuote(side.getQuote(i), i, quoteSide));
            }
        });

        return entries;
    }

    private static L2EntryDto convertQuote(OrderBookQuote quote, short level, QuoteSide side) {
        L2EntryDto l2Entry = new L2EntryDto();
        l2Entry.action = L2Action.INSERT;
        l2Entry.level = level;
        l2Entry.setPrice(quote.getPrice());
        l2Entry.setQuantity(quote.getSize());
        l2Entry.side = side == QuoteSide.BID ? Side.BUY : Side.SELL;
        l2Entry.alphanumericExchangeId = quote.getExchangeId();
        try {
            l2Entry.exchangeId = AlphanumericUtils.toString(l2Entry.alphanumericExchangeId);
        } catch (Throwable t) {
            l2Entry.exchangeId = null;
        }

        return l2Entry;
    }

    private static L2PackageType createL2PackageType(PackageType packageType) {
        if (packageType == null)
            return null;

        switch (packageType) {
            case VENDOR_SNAPSHOT:
            case PERIODICAL_SNAPSHOT:
                return L2PackageType.SNAPSHOT_FULL_REFRESH;

            case INCREMENTAL_UPDATE:
                return L2PackageType.INCREMENTAL_UPDATE;
        }

        throw new IllegalArgumentException("Unsupported package type: " + packageType);
    }

}