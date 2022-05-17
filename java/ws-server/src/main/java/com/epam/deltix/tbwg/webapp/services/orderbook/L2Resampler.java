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

import com.epam.deltix.common.orderbook.OrderBook;
import com.epam.deltix.common.orderbook.OrderBookQuote;
import com.epam.deltix.common.orderbook.impl.OrderBookFactory;
import com.epam.deltix.common.orderbook.options.OrderBookOptionsBuilder;
import com.epam.deltix.common.orderbook.options.OrderBookType;
import com.epam.deltix.common.orderbook.options.UpdateMode;
import com.epam.deltix.tbwg.webapp.model.orderbook.L2PackageDto;
import com.epam.deltix.timebase.messages.universal.DataModelType;
import com.epam.deltix.timebase.messages.universal.PackageHeaderInfo;
import com.epam.deltix.util.collections.generated.LongHashSet;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

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

    private final OrderBook<OrderBookQuote> book;
    private final OrderBookConverter orderBookConverter = new OrderBookConverter();

    public L2Resampler(String symbol) {
        book = OrderBookFactory.create(
            new OrderBookOptionsBuilder()
                .symbol(symbol)
                .orderBookType(OrderBookType.CONSOLIDATED)
                .updateMode(UpdateMode.WAITING_FOR_SNAPSHOT)
                .quoteLevels(DataModelType.LEVEL_TWO)
                .build()
        );
    }

    public void addOnDiffComputedListener(ObjObjObjConsumer consumer) {
        // resampler logic is not implemented
    }

    public void computeDiff(long timestamp) {
        // resampler logic is not implemented
    }

    public synchronized void process(PackageHeaderInfo packageHeader) {
        book.update(packageHeader);
    }

    public synchronized List<L2PackageDto> getFixedBook(LongHashSet hiddenExchanges) {
        return book.getExchanges().stream()
            .filter(e -> !hiddenExchanges.contains(e.getExchangeId()))
            .map(e -> orderBookConverter.convertExchange(System.currentTimeMillis(), book.getSymbol().orElse(""), e))
            .collect(Collectors.toList());
    }
}
