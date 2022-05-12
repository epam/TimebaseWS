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

import java.util.Objects;

/**
 * @author Andrii_Ostapenko1
 */
public class MutableExchangeImpl<Quote, Processor extends QuoteProcessor<Quote>>
        implements MutableExchange<Quote, Processor> {

    private final long exchangeId;
    private final Processor processor;

    public MutableExchangeImpl(final long exchangeId,
                               final Processor processor) {
        Objects.requireNonNull(processor);
        this.exchangeId = exchangeId;
        this.processor = processor;
    }

    @Override
    public long getExchangeId() {
        return exchangeId;
    }

    @Override
    public MarketSide<Quote> getMarketSide(final QuoteSide side) {
        return processor.getMarketSide(side);
    }

    @Override
    public Processor getProcessor() {
        return processor;
    }
}
