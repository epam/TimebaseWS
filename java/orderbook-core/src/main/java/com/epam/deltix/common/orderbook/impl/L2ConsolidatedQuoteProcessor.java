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

import com.epam.deltix.common.orderbook.options.GapMode;
import com.epam.deltix.common.orderbook.options.UpdateMode;
import com.epam.deltix.common.orderbook.utils.ObjectPool;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.L2EntryUpdateInfo;

/**
 * @author Andrii_Ostapenko1
 */
class L2ConsolidatedQuoteProcessor<Quote extends MutableOrderBookQuote> extends AbstractL2MultiExchangeProcessor<Quote> {


    public L2ConsolidatedQuoteProcessor(final int initialExchangeCount,
                                        final int initialDepth,
                                        final int maxDepth,
                                        final ObjectPool<Quote> pool,
                                        final GapMode gapMode,
                                        final UpdateMode updateMode) {
        super(initialExchangeCount, initialDepth, maxDepth, pool, gapMode, updateMode);
    }

    @Override
    public void updateQuote(Quote previous, QuoteSide side, L2EntryUpdateInfo update) {
        // ignore
    }

    @Override
    public String getDescription() {
        return "L2/Consolidation of multiple exchanges";
    }

    @Override
    public void clear() {
        asks.clear();
        bids.clear();
        for (MutableExchange<Quote, L2Processor<Quote>> exchange : this.getExchanges()) {
            exchange.getProcessor().clear();
        }
    }

    @Override
    public void removeQuote(final Quote remove,
                            final L2MarketSide<Quote> marketSide) {
        final short level = marketSide.binarySearchLevelByPrice(remove);
        if (level != L2MarketSide.NOT_FOUND) {
            if (remove.getExchangeId() == marketSide.getQuote(level).getExchangeId()) {
                marketSide.remove(level);
            } else {
                final int size = exchanges.size();
                for (int i = 0, k = level + i; i < size; i++, k = level + i) {
                    if (marketSide.hasLevel((short) (k))) {
                        if (remove.getExchangeId() == marketSide.getQuote(k).getExchangeId()) {
                            marketSide.remove(k);
                            return;
                        }
                    } else {
                        return;
                    }
                }
                for (int i = 0, k = level - i; i < size; i++, k = level - i) {
                    if (marketSide.hasLevel((short) (k))) {
                        if (remove.getExchangeId() == marketSide.getQuote(k).getExchangeId()) {
                            marketSide.remove(k);
                            return;
                        }
                    } else {
                        return;
                    }
                }
            }
        }
    }

    @Override
    public Quote insertQuote(final Quote insert,
                             final L2MarketSide<Quote> marketSide) {
        final short level = marketSide.binarySearchNextLevelByPrice(insert);
        marketSide.add(level, insert);
        return insert;
    }

    @Override
    public L2Processor<Quote> clearExchange(final L2Processor<Quote> exchange) {
        removeAll(exchange, QuoteSide.ASK);
        removeAll(exchange, QuoteSide.BID);
        exchange.clear();
        return exchange;
    }

}
