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

import com.epam.deltix.common.orderbook.MarketSide;
import com.epam.deltix.timebase.messages.universal.QuoteSide;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;

/**
 * @author Andrii_Ostapenko1
 */
abstract class AbstractL2MarketSide<Quote extends MutableOrderBookQuote> implements L2MarketSide<Quote> {

    private final List<Quote> data;
    private final ReusableIterator<Quote> itr;
    // This parameter is used to limit maximum elements.
    private final short maxDepth;
    // This parameter is used to understand whether the side is full or not.
    private short depthLimit;

    public AbstractL2MarketSide(final int initialCapacity,
                                final short maxDepth) {
        this.maxDepth = maxDepth;
        this.depthLimit = maxDepth;
        this.data = new ArrayList<>(initialCapacity);
        this.itr = new ReusableIterator<>();
    }

    @Override
    public short getMaxDepth() {
        return maxDepth;
    }

    @Override
    public int depth() {
        return data.size();
    }

    @Override
    public void clear() {
        data.clear();
    }

    @Override
    public boolean isEmpty() {
        return data.isEmpty();
    }

    @Override
    public Quote getQuote(final int level) {
        return data.get(level);
    }

    @Override
    public void add(final short level, final Quote insert) {
        data.add(level, insert);
    }

    @Override
    public void addLast(Quote insert) {
        data.add(insert);
    }

    @Override
    public void add(final Quote insert) {
        data.add(insert);
    }

    @Override
    public Quote remove(final int level) {
        return data.remove(level);
    }

    @Override
    public short binarySearchLevelByPrice(final Quote find) {
        int low = 0;
        int high = data.size() - 1;

        Quote quote;
        while (low <= high) {
            int mid = (low + high) >>> 1;
            quote = data.get(mid);

            int cmp = quote.compareTo(find);

            if (cmp < 0)
                if (getSide() == QuoteSide.BID) {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            else if (cmp > 0) {
                if (getSide() == QuoteSide.BID) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            } else {
                return (short) mid;
            }
        }
        return NOT_FOUND;
    }

    @Override
    public short binarySearchNextLevelByPrice(final Quote find) {
        int low = 0;
        int high = data.size() - 1;

        Quote quote;
        while (low <= high) {
            int mid = (low + high) >>> 1;
            quote = data.get(mid);

            int cmp = quote.compareTo(find);

            if (cmp < 0)
                if (getSide() == QuoteSide.BID) {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            else if (cmp > 0) {
                if (getSide() == QuoteSide.BID) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            } else {
                return (short) mid;
            }
        }
        return (short) low;
    }

    @Override
    public boolean hasLevel(final short level) {
        if (level >= maxDepth || level < 0) {
            return false;
        } else if (data.size() > level) {
            return Objects.nonNull(data.get(level));
        }
        return false;
    }

    @Override
    public void trim() {
        this.depthLimit = (short) data.size();
    }

    @Override
    public Quote getWorstQuote() {
        return data.get(data.size() - 1);
    }

    @Override
    public Quote removeWorstQuote() {
        return data.remove(data.size() - 1);
    }

    @Override
    public boolean isFull() {
        return depth() >= depthLimit;
    }

    //TODO add doc WTF!! and refactor
    @Override
    public boolean isGap(final short level) {
        if (!hasLevel(level)) {
            return depth() != level || // If trying to add to end
                    level >= getMaxDepth() || // If we're using maxDepth parameter.
                    (depth() == level && isFull()); //Receive incorrect level after snapshot. More than max depth
        }
        return false;
    }

    @Override
    public Quote getBestQuote() {
        return data.get(0);
    }

    @Override
    public String toString() {
        final StringBuilder builder = new StringBuilder();
        for (Quote quote : this) {
            builder.append(quote).append(" ");
        }
        return builder.toString();
    }

    @Override
    public Iterator<Quote> iterator(final short fromLevel, final short toLevel) {
        itr.iterateBy(this, fromLevel, toLevel);
        return itr;
    }

    /**
     * An adapter to safely externalize the value iterator.
     */
    final static class ReusableIterator<Quote> implements Iterator<Quote> {

        /**
         * Index of element to be returned by subsequent call to next.
         */
        private short cursor;

        private short size;

        private MarketSide<Quote> marketSide;

        private void iterateBy(final MarketSide<Quote> marketSide, final short cursor, final short size) {
            Objects.requireNonNull(marketSide);
            this.marketSide = marketSide;
            this.cursor = cursor;
            if (size > marketSide.depth() || size < 0) {
                this.size = (short) marketSide.depth();
            } else {
                this.size = size;
            }
            if (cursor > size || cursor < 0) {
                this.cursor = size;
            }
        }

        @Override
        public boolean hasNext() {
            return cursor != size;
        }

        @Override
        public Quote next() {
            return marketSide.getQuote(cursor++);
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException("Read only iterator");
        }
    }

    static class ASK<Quote extends MutableOrderBookQuote> extends AbstractL2MarketSide<Quote> {

        public ASK(final int initialCapacity,
                   final short maxDepth) {
            super(initialCapacity, maxDepth);
        }

        @Override
        public QuoteSide getSide() {
            return QuoteSide.ASK;
        }
    }

    static class BID<Quote extends MutableOrderBookQuote> extends AbstractL2MarketSide<Quote> {

        public BID(final int initialDepth,
                   final short maxDepth) {
            super(initialDepth, maxDepth);
        }

        @Override
        public QuoteSide getSide() {
            return QuoteSide.BID;
        }
    }
}
