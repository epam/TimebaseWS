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

import com.epam.deltix.orderbook.core.api.OrderBook;
import com.epam.deltix.orderbook.core.api.OrderBookFactory;
import com.epam.deltix.orderbook.core.api.OrderBookQuote;
import com.epam.deltix.orderbook.core.options.OrderBookOptionsBuilder;
import com.epam.deltix.orderbook.core.options.OrderBookType;
import com.epam.deltix.orderbook.core.options.UpdateMode;
import com.epam.deltix.tbwg.webapp.model.orderbook.L2PackageDto;
import com.epam.deltix.timebase.messages.universal.BaseEntryInfo;
import com.epam.deltix.timebase.messages.universal.DataModelType;
import com.epam.deltix.timebase.messages.universal.PackageHeaderInfo;
import com.epam.deltix.util.collections.generated.LongEnumeration;
import com.epam.deltix.util.collections.generated.LongHashSet;
import com.epam.deltix.util.collections.generated.LongToObjectHashMap;
import com.epam.deltix.util.collections.generated.ObjectList;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

// mock for OrderBookSubscription

@FunctionalInterface
interface ObjObjObjConsumer {
    void accept(Object first, Object second, Object third);
    default ObjObjObjConsumer andThen(ObjObjObjConsumer after) {
        Objects.requireNonNull(after);
        return (Object t, Object t1, Object t2) -> { accept(t, t1, t2); after.accept(t, t1, t2); };
    }
}

public class L2Resampler {

    private final String symbol;
    private final LongToObjectHashMap<OrderBook<OrderBookQuote>> books = new LongToObjectHashMap<>();
    private final OrderBookConverter orderBookConverter = new OrderBookConverter();

    public L2Resampler(String symbol) {
        this.symbol = symbol;
    }

    public void addOnDiffComputedListener(ObjObjObjConsumer consumer) {
        // resampler logic is not implemented
    }

    public void computeDiff(long timestamp) {
        // resampler logic is not implemented
    }

    public synchronized void process(PackageHeaderInfo packageHeader) {
        OrderBook<OrderBookQuote> book = getOrCreateOrderBook(getExchange(packageHeader));
        if (book != null) {
            book.update(packageHeader);
        }
    }

    public synchronized List<L2PackageDto> getFixedBook(LongHashSet hiddenExchanges) {
        List<L2PackageDto> result = new ArrayList<>();

        LongEnumeration enumeration = books.keys();
        while (enumeration.hasMoreElements()) {
            long exchange = enumeration.nextLongElement();
            if (hiddenExchanges.contains(exchange)) {
                continue;
            }

            OrderBook<OrderBookQuote> book = books.get(exchange, null);
            if (book != null) {
                result.add(
                    orderBookConverter.convertExchange(
                        System.currentTimeMillis(), book.getSymbol().orElse(""), book
                    )
                );
            }
        }

        return result;
    }

    private long getExchange(PackageHeaderInfo packageHeader) {
        ObjectList<BaseEntryInfo> entries = packageHeader.getEntries();
        if (entries == null || entries.isEmpty()) {
            return Long.MIN_VALUE;
        }

        return entries.get(0).getExchangeId();
    }

    private OrderBook<OrderBookQuote> getOrCreateOrderBook(long exchange) {
        if (exchange == Long.MIN_VALUE) {
            return null;
        }

        OrderBook<OrderBookQuote> book = books.get(exchange, null);
        if (book == null) {
            books.put(exchange, OrderBookFactory.create(
                new OrderBookOptionsBuilder()
                    .symbol(symbol)
                    .orderBookType(OrderBookType.SINGLE_EXCHANGE)
                    .updateMode(UpdateMode.WAITING_FOR_SNAPSHOT)
                    .quoteLevels(DataModelType.LEVEL_TWO)
                    .build()
            ));
        }

        return book;
    }
}