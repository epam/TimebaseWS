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
package com.epam.deltix.common.orderbook.options;

import com.epam.deltix.timebase.messages.universal.DataModelType;

public class OrderBookOptionsBuilder implements OrderBookOptions, BindOrderBookOptionsBuilder {

    //@formatter:off
    // TimeBase code style!
    private Optional<DataModelType>     quoteLevels                 = Optional.none();
    private Optional<OrderBookType>     bookType                    = Optional.none();
    private Optional<UpdateMode>        updateMode                  = Optional.none();
    private Optional<GapMode>           gapMode                     = Optional.none();
    private Optional<String>            symbol                      = Optional.none();
    private Optional<Integer>           initialDepth                = Optional.none();
    private Optional<Integer>           maxDepth                    = Optional.none();
    private Optional<Integer>           initialExchangesPoolSize    = Optional.none();
    private Optional<OrderBookOptions>  otherOptions                = Optional.none();
    //@formatter:on

    @Override
    public BindOrderBookOptionsBuilder parent(final OrderBookOptions other) {
        this.otherOptions = Optional.of(other);
        return this;
    }

    @Override
    public OrderBookOptions build() {
        return this;
    }

    @Override
    public BindOrderBookOptionsBuilder updateMode(final UpdateMode mode) {
        this.updateMode = Optional.of(mode);
        return this;
    }

    @Override
    public Optional<UpdateMode> getUpdateMode() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getUpdateMode().orAnother(updateMode);
        } else {
            return updateMode;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder quoteLevels(final DataModelType type) {
        this.quoteLevels = Optional.of(type);
        return this;
    }

    @Override
    public Optional<DataModelType> getQuoteLevels() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getQuoteLevels().orAnother(quoteLevels);
        } else {
            return quoteLevels;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder orderBookType(final OrderBookType type) {
        this.bookType = Optional.of(type);
        return this;
    }

    @Override
    public Optional<OrderBookType> getBookType() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getBookType().orAnother(bookType);
        } else {
            return bookType;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder initialDepth(final int value) {
        this.initialDepth = Optional.of(value);
        return this;
    }

    @Override
    public Optional<Integer> getInitialDepth() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getInitialDepth().orAnother(initialDepth);
        } else {
            return initialDepth;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder maxDepth(int value) {
        this.maxDepth = Optional.of(value);
        return this;
    }

    @Override
    public Optional<Integer> getMaxDepth() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getMaxDepth().orAnother(maxDepth);
        } else {
            return maxDepth;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder initialExchangesPoolSize(final int value) {
        this.initialExchangesPoolSize = Optional.of(value);
        return this;
    }

    @Override
    public Optional<Integer> getInitialExchangesPoolSize() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getInitialExchangesPoolSize().orAnother(initialExchangesPoolSize);
        } else {
            return initialExchangesPoolSize;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder symbol(final String symbol) {
        this.symbol = Optional.of(symbol);
        return this;
    }

    @Override
    public Optional<String> getSymbol() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getSymbol().orAnother(symbol);
        } else {
            return symbol;
        }
    }

    @Override
    public BindOrderBookOptionsBuilder gapMode(final GapMode mode) {
        this.gapMode = Optional.of(mode);
        return this;
    }

    @Override
    public Optional<GapMode> getGapMode() {
        if (otherOptions.hasValue()) {
            return otherOptions.get().getGapMode().orAnother(gapMode);
        } else {
            return gapMode;
        }
    }
}
