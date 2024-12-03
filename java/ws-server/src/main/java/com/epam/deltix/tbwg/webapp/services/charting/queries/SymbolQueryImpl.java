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
package com.epam.deltix.tbwg.webapp.services.charting.queries;

import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;

import java.util.Arrays;

public abstract class SymbolQueryImpl extends LinesQueryImpl implements SymbolQuery {

    private final String stream;
    private final String[] symbols;

    protected final ModelDataSourceType dataSource;

    public SymbolQueryImpl(String stream, String[] symbols, ChartType type,
                           TimeInterval interval, long pointInterval, boolean isLive,
                           ModelDataSourceType dataSource)
    {
        super(type, interval, pointInterval, isLive);
        this.stream = stream;
        this.symbols = symbols;
        this.dataSource = dataSource;
    }

    @Override
    public String getStream() {
        return stream;
    }

    @Override
    public String[] getSymbols() {
        return symbols;
    }

    @Override
    public ModelDataSourceType getDataSource() {
        return dataSource;
    }

    @Override
    public String toString() {
        final StringBuffer sb = new StringBuffer("SymbolQuery ");
        sb.append(stream).append("[");
        sb.append(Arrays.toString(symbols)).append('|');
        sb.append(interval).append('|');
        sb.append(type).append('|');
        sb.append(pointInterval);
        sb.append(isLive ? "|live" : "");
        sb.append(']');
        return sb.toString();
    }
}