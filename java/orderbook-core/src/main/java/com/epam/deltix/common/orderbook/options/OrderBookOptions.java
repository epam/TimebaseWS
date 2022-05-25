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

/**
 * Order book options.
 *
 * @author Andrii_Ostapenko1
 */
public interface OrderBookOptions {

    /**
     * Startup mode.
     *
     * @return snapshot mode.
     */
    Optional<UpdateMode> getUpdateMode();

    /**
     * Stock symbol.
     *
     * @return stock symbol.
     */
    Optional<String> getSymbol();

    /**
     * Quote levels.
     *
     * @return quote levels.
     */
    Optional<DataModelType> getQuoteLevels();

    /**
     * Order book type.
     *
     * @return order book mode.
     */
    Optional<OrderBookType> getBookType();

    /**
     * Stock quote gap mode.
     *
     * @return gap mode.
     */
    Optional<GapMode> getGapMode();

    /**
     * Initial depth of market.
     *
     * @return initial max depth of market.
     */
    Optional<Integer> getInitialDepth();

    /**
     * Max depth of market (Limit).
     *
     * @return  max depth of market.
     */
    Optional<Integer> getMaxDepth();

    /**
     * Initial pool size for stock exchanges.
     *
     * @return pool size.
     */
    Optional<Integer> getInitialExchangesPoolSize();
}
