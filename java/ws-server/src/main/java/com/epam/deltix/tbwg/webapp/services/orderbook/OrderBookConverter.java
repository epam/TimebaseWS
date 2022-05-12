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
package com.epam.deltix.tbwg.webapp.services.orderbook;

import com.epam.deltix.common.orderbook.MarketSide;
import com.epam.deltix.common.orderbook.OrderBook;
import com.epam.deltix.common.orderbook.OrderBookQuote;
import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.tbwg.webapp.model.orderbook.*;

import com.epam.deltix.tbwg.webapp.utils.ArrayPoolUtils;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.LongHashSet;

import java.util.ArrayList;
import java.util.Arrays;

public class OrderBookConverter {

    private final ArrayPoolUtils<L2EntryDto> pool = new ArrayPoolUtils<>(L2EntryDto::new);
    private final L2PackageDto packageDto = new L2PackageDto();

    private int currentPoolPosition;

    public OrderBookConverter() {
        packageDto.entries = new ArrayList<>();
        packageDto.sequenceNumber = System.currentTimeMillis();
    }

    public L2PackageDto convertBook(long timestamp, OrderBook<OrderBookQuote> book, LongHashSet hiddenExchanges) {
        packageDto.timestamp = timestamp;
        packageDto.setSecurityId(book.getSymbol().orElse(""));
        packageDto.type = createL2PackageType(PackageType.PERIODICAL_SNAPSHOT);
        packageDto.sequenceNumber++;
        packageDto.entries.clear();

        currentPoolPosition = 0;
        Arrays.asList(new QuoteSide[]{ QuoteSide.ASK, QuoteSide.BID }).forEach(quoteSide -> {
            MarketSide<OrderBookQuote> side = book.getMarketSide(quoteSide);
            for (short i = 0; i < side.depth(); ++i) {
                OrderBookQuote quote = side.getQuote(i);

                L2EntryDto l2Entry = pool.getL2Entry(currentPoolPosition++);
                l2Entry.action = L2Action.INSERT;
                l2Entry.level = i;
                l2Entry.setPrice(quote.getPrice());
                l2Entry.setQuantity(quote.getSize());
                l2Entry.side = quoteSide == QuoteSide.BID ? Side.BUY : Side.SELL;
                l2Entry.alphanumericExchangeId = quote.getExchangeId();
                try {
                    l2Entry.exchangeId = AlphanumericUtils.toString(l2Entry.alphanumericExchangeId);
                } catch (Throwable t) {
                    l2Entry.exchangeId = null;
                }

                packageDto.entries.add(l2Entry);
            }
        });

        return packageDto;
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
