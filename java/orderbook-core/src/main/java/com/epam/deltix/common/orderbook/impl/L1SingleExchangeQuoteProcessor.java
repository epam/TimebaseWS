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
package com.epam.deltix.common.orderbook.impl;

import com.epam.deltix.common.orderbook.ExchangeList;
import com.epam.deltix.common.orderbook.options.Optional;
import com.epam.deltix.common.orderbook.options.UpdateMode;
import com.epam.deltix.common.orderbook.utils.ObjectPool;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.BaseEntryInfo;
import com.epam.deltix.timebase.messages.universal.BookResetEntryInfo;
import com.epam.deltix.timebase.messages.universal.L1EntryInfo;
import com.epam.deltix.timebase.messages.universal.PackageHeaderInfo;
import com.epam.deltix.util.collections.generated.ObjectList;

/**
 * @author Andrii_Ostapenko1
 */
class L1SingleExchangeQuoteProcessor<Quote extends MutableOrderBookQuote> implements L1Processor<Quote> {

    protected final L1MarketSide<Quote> bids;
    protected final L1MarketSide<Quote> asks;

    private final MutableExchangeList<MutableExchange<Quote, L1Processor<Quote>>> exchanges;

    // Parameters
    private final UpdateMode updateMode;
    private final ObjectPool<Quote> pool;

    /**
     * This parameter using for handle book reset entry.
     *
     * @see QuoteProcessor#isWaitingForSnapshot()
     */
    private boolean isWaitingForSnapshot = false;

    public L1SingleExchangeQuoteProcessor(final ObjectPool<Quote> pool,
                                          final UpdateMode updateMode) {
        this.pool = pool;
        this.updateMode = updateMode;
        this.asks = L1MarketSide.factory(QuoteSide.ASK);
        this.bids = L1MarketSide.factory(QuoteSide.BID);
        this.exchanges = new MutableExchangeListImpl<>();
    }

    @Override
    public String getDescription() {
        return "L1/Single exchange";
    }

    @Override
    public L1MarketSide<Quote> getMarketSide(final QuoteSide side) {
        return side == QuoteSide.BID ? bids : asks;
    }

    @Override
    public void clear() {
        releaseAndClean(asks);
        releaseAndClean(bids);
    }

    @Override
    public boolean isEmpty() {
        return asks.isEmpty() && bids.isEmpty();
    }

    @Override
    public Quote processL1EntryNewInfo(final L1EntryInfo l1EntryNewInfo) {
        final long exchangeId = l1EntryNewInfo.getExchangeId();
        final Optional<MutableExchange<Quote, L1Processor<Quote>>> exchange = getOrCreateExchange(exchangeId);
        if (!exchange.hasValue()) {
            return null;// TODO add null check
        }

        if (exchange.get().getProcessor().isWaitingForSnapshot()) {
            return null;
        }

        if (exchange.get().getProcessor().isEmpty()) {
            switch (updateMode) {
                case WAITING_FOR_SNAPSHOT:
                    return null; // Todo ADD null check!!
                case NON_WAITING_FOR_SNAPSHOT:
                    break;
            }
        }

        final QuoteSide side = l1EntryNewInfo.getSide();
        final L1MarketSide<Quote> marketSide = exchange.get().getProcessor().getMarketSide(side);

        final Quote quote;
        if (marketSide.isEmpty()) {
            quote = pool.borrow();
            marketSide.insert(quote);
        } else {
            quote = marketSide.getBestQuote();
        }
        updateByL1EntryNew(quote, l1EntryNewInfo);
        return quote;
    }

    @Override
    // TODO add validation for exchange id
    public void processL1VendorSnapshot(final PackageHeaderInfo marketMessageInfo) {
        final ObjectList<BaseEntryInfo> entries = marketMessageInfo.getEntries();
        for (int i = 0; i < entries.size(); i++) {
            final BaseEntryInfo pck = entries.get(i);
            final L1EntryInfo l1EntryInfo = (L1EntryInfo) pck;
            final QuoteSide side = l1EntryInfo.getSide();

            final L1MarketSide<Quote> marketSide = getMarketSide(side);

            final Quote quote;
            if (marketSide.isEmpty()) {
                quote = pool.borrow();
                marketSide.insert(quote);
            } else {
                quote = marketSide.getBestQuote();
            }
            updateByL1EntryNew(quote, l1EntryInfo);
        }

        notWaitingForSnapshot();
    }

    @Override
    public boolean isWaitingForSnapshot() {
        return isWaitingForSnapshot;
    }

    private void waitingForSnapshot() {
        if (!isWaitingForSnapshot()) {
            isWaitingForSnapshot = true;
        }
    }

    private void notWaitingForSnapshot() {
        if (isWaitingForSnapshot()) {
            isWaitingForSnapshot = false;
        }
    }

    @Override
    public void processBookResetEntry(final BookResetEntryInfo bookResetEntryInfo) {
        clear();
        waitingForSnapshot();
    }

    @Override
    public ExchangeList<MutableExchange<Quote, L1Processor<Quote>>> getExchanges() {
        return exchanges;
    }

    private void releaseAndClean(final L1MarketSide<Quote> marketSide) {
        for (int i = 0; i < marketSide.depth(); i++) {
            final Quote quote = marketSide.getQuote(i);
            pool.release(quote);
        }
        marketSide.clear();
    }

    /**
     * Get stock exchange holder by id(create new if it does not exist).
     * You can create only one exchange.
     *
     * @param exchangeId - id of exchange.
     * @return exchange book by id.
     */
    private Optional<MutableExchange<Quote, L1Processor<Quote>>> getOrCreateExchange(final long exchangeId) {
        if (!exchanges.isEmpty()) {
            return exchanges.getById(exchangeId);
        }
        final MutableExchangeImpl<Quote, L1Processor<Quote>> exchange = new MutableExchangeImpl<>(exchangeId, this);
        exchanges.add(exchange);
        return exchanges.getById(exchangeId);
    }

    /**
     * Update quote with L1EntryNew.
     *
     * @param l1EntryInfo - L1EntryNew
     */
    protected void updateByL1EntryNew(final Quote quote, final L1EntryInfo l1EntryInfo) {
        if (quote.getSize() != l1EntryInfo.getSize()) {
            quote.setSize(l1EntryInfo.getSize());
        }
        if (quote.getPrice() != l1EntryInfo.getPrice()) {
            quote.setPrice(l1EntryInfo.getPrice());
        }
        if (quote.getExchangeId() != l1EntryInfo.getExchangeId()) {
            quote.setExchangeId(l1EntryInfo.getExchangeId());
        }
        if (quote.getNumberOfOrders() != l1EntryInfo.getNumberOfOrders()) {
            quote.setNumberOfOrders(l1EntryInfo.getNumberOfOrders());
        }
    }
}
