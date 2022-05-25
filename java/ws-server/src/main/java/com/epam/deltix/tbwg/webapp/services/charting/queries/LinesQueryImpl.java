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
package com.epam.deltix.tbwg.webapp.services.charting.queries;

import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;

public class LinesQueryImpl implements LinesQuery {

    protected final TimeInterval interval;
    protected final int maxPointsCount;
    protected final long pointInterval;
    protected final ChartType type;
    protected final boolean isLive;

    public LinesQueryImpl(ChartType type, TimeInterval interval,
                          int maxPointsCount, long pointInterval, boolean isLive)
    {
        this.type = type;
        this.interval = interval;
        this.maxPointsCount = maxPointsCount;
        this.pointInterval = pointInterval;
        this.isLive = isLive;
    }

    @Override
    public ChartType getType() {
        return type;
    }

    @Override
    public TimeInterval getInterval() {
        return interval;
    }

    @Override
    public int getMaxPointsCount() {
        return maxPointsCount;
    }

    @Override
    public long getPointInterval() {
        return pointInterval;
    }

    @Override
    public boolean isLive() {
        return isLive;
    }

}

