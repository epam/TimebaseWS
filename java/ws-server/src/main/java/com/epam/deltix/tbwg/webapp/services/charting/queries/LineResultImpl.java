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

import io.reactivex.Observable;

public class LineResultImpl implements LineResult {

    private final String name;
    private final int linesCount;
    private final Observable<?> points;
    private final long aggregation;
    private final long newWindowSize;

    public LineResultImpl(String name, Observable<?> points, long aggregation, long newWindowSize) {
        this(name, 1, points, aggregation, newWindowSize);
    }

    public LineResultImpl(String name, int linesCount, Observable<?> points, long aggregation, long newWindowSize) {
        this.name = name;
        this.linesCount = linesCount;
        this.points = points;
        this.aggregation = aggregation;
        this.newWindowSize = newWindowSize;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getAggregation() {
        return aggregation;
    }

    @Override
    public long getNewWindowSize() {
        return newWindowSize;
    }

    @Override
    public int linesCount() {
        return linesCount;
    }

    @Override
    public Observable<?> getPoints() {
        return points;
    }
}
