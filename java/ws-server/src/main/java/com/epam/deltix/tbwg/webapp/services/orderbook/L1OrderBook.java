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
package com.epam.deltix.tbwg.webapp.services.orderbook;

import com.epam.deltix.containers.CharSequenceUtils;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.LongToObjectHashMap;
import com.epam.deltix.util.collections.generated.ObjectList;
import lombok.Getter;


@Getter
public class L1OrderBook {

    private final String symbol;
    private final LongToObjectHashMap<OrderBook> exchangeBooks = new LongToObjectHashMap<>();

    public L1OrderBook(String symbol) {
        this.symbol = symbol;
    }


    public void update(PackageHeaderInfo message) {
        if (message != null && message.hasSymbol() && CharSequenceUtils.equals(symbol, message.getSymbol())) {
            ObjectList<BaseEntryInfo> entries = message.getEntries();
            if (isL1Entries(entries)) {
                for (int i = 0; i < entries.size(); i++) {
                    update((L1EntryInfo) entries.get(i));
                }
            }
        }
    }

    private boolean isL1Entries(ObjectList<BaseEntryInfo> entries) {
        return entries != null && entries.size() > 0 && entries.get(0) instanceof L1EntryInfo;
    }

    private void update(L1EntryInfo entry) {
        OrderBook book = getExchangeBook(entry.getExchangeId());
        book.update(entry);
    }

    private OrderBook getExchangeBook(long exchangeId) {
        OrderBook orderBook = exchangeBooks.get(exchangeId, null);
        if (orderBook == null) {
            orderBook = new OrderBook(symbol, exchangeId);
            exchangeBooks.put(exchangeId, orderBook);
        }
        return orderBook;
    }

    @Getter
    public static class OrderBook {
        private final L1Entry ask = new L1Entry();
        private final L1Entry bid = new L1Entry();
        private final String symbol;
        private final long exchangeId;

        public OrderBook(String symbol, long exchangeId) {
            this.symbol = symbol;
            this.exchangeId = exchangeId;
            ask.setSide(QuoteSide.ASK);
            ask.setExchangeId(exchangeId);
            bid.setSide(QuoteSide.BID);
            bid.setExchangeId(exchangeId);
        }

        private void update(L1EntryInfo entry) {
            switch (entry.getSide()) {
                case ASK:
                    update(entry, ask);
                case BID:
                    update(entry, bid);
            }
        }

        private void update(L1EntryInfo source, L1Entry target) {
            target.setSize(source.getSize());
            target.setPrice(source.getPrice());
        }
    }
}