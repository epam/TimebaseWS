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
package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;

import java.util.List;

public abstract class SymbolFilterChartTransformation<Downstream, Upstream> extends AbstractChartTransformation<Downstream, Upstream> {
    private final ChartDataSource source;
    private final String symbol;
    private final boolean isSingleSymbolSource;
    private int symbolIndex = Integer.MIN_VALUE;

    public SymbolFilterChartTransformation(List<Class<? extends Upstream>> inputClasses, List<Class<? extends Downstream>> outputClasses,
                                           ChartDataSource source, String symbol, boolean isSingleSymbolSource) {
        super(inputClasses, outputClasses);

        this.source = source;
        this.symbol = symbol;
        this.isSingleSymbolSource = isSingleSymbolSource;
    }

    protected boolean isProcessSymbol() {
        if (isSingleSymbolSource) return true;
        if (symbolIndex != Integer.MIN_VALUE) {
            return symbolIndex == source.getEntityIndex();
        } else {
            if (symbol.equals(source.getSymbol())) {
                symbolIndex = source.getEntityIndex();
                return true;
            }
            return false;
        }
    }
}