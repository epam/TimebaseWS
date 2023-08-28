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
package com.epam.deltix.tbwg.webapp.model.charting;

import com.epam.deltix.tbwg.webapp.model.TimeRangeDef;
import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;

import java.util.Map;

/**
 * The container for charting getQuery result.
 * @label ChartingFrame
 */
public class ChartingFrameDef {
    private final String name;
    private final Map<String, ChartingLineDef> lines;
    private final TimeRangeDef effectiveWindow;

    public ChartingFrameDef(String name, Map<String, ChartingLineDef> lines, final TimeInterval effectiveWindow) {
        this.name = name;
        this.lines = lines;
        this.effectiveWindow = new TimeRangeDef(effectiveWindow.getStartTime(), effectiveWindow.getEndTime());
    }

    public String getName() {
        return name;
    }

    /**
     * The collection of charting lines.
     */
    public Map<String, ChartingLineDef> getLines() {
        return lines;
    }

    /**
     * The effective window where charting lines were calculated.
     * Effective window might be different from the requested window due to interval enlargement.
     */
    public TimeRangeDef getEffectiveWindow() {
        return effectiveWindow;
    }
}
