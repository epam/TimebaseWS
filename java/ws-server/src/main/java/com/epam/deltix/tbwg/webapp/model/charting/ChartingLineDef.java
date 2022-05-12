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
package com.epam.deltix.tbwg.webapp.model.charting;

import com.epam.deltix.tbwg.webapp.model.charting.line.LineElement;

import java.util.List;

/**
 * The charting data for a line.
 */
public class ChartingLineDef {
    private final long aggregationSizeMs;
    private final long newWindowSizeMs;
    private final List<LineElement> line;

    public ChartingLineDef(long aggregationSizeMs, long newWindowSizeMs, List<LineElement> line) {
        this.aggregationSizeMs = aggregationSizeMs;
        this.newWindowSizeMs = newWindowSizeMs;
        this.line = line;
    }

    /**
     * The size of aggregation (in milliseconds) used to create the line.
     */
    public long getAggregationSizeMs() {
        return aggregationSizeMs;
    }

    /**
     * The size of a charting window (in milliseconds) for which the new line detalization is available.
     */
    public long getNewWindowSizeMs() {
        return newWindowSizeMs;
    }

    /**
     * The list of line points.
     */
    public List<LineElement> getPoints() {
        return line;
    }
}
