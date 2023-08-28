/*
 * Copyright 2023 EPAM Systems, Inc
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

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

public class LineResultImpl implements LineResult {

    private final String name;
    private final String[] lineNames;
    private final int linesCount;
    private final Observable<?> points;
    private final long aggregation;
    private final long newWindowSize;
    private final AtomicLong pointsCount = new AtomicLong();

    public LineResultImpl(String name, Observable<?> points, long aggregation, long newWindowSize) {
        this(name, generateLineNames(1), points, aggregation, newWindowSize);
    }

    public LineResultImpl(String name, int linesCount, Observable<?> points, long aggregation, long newWindowSize) {
        this(name, generateLineNames(linesCount), points, aggregation, newWindowSize);
    }

    public LineResultImpl(String name, String[] lineNames, Observable<?> points, long aggregation, long newWindowSize) {
        this.name = name;
        this.lineNames = lineNames;
        this.linesCount = lineNames.length;
        this.points = points;
        this.aggregation = aggregation;
        this.newWindowSize = newWindowSize;
    }

    private static String[] generateLineNames(int count) {
        List<String> names = new ArrayList<>();
        for (int i = 0; i < count; ++i) {
            names.add(String.valueOf(i));
        }

        return names.toArray(new String[0]);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getName(int lineId) {
        return name.replace("[]", "[" + (lineNames[lineId] != null ? lineNames[lineId] : lineId) + "]");
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

    @Override
    public AtomicLong pointsCount() {
        return pointsCount;
    }
}
