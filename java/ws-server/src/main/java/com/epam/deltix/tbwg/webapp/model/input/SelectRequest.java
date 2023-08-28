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
package com.epam.deltix.tbwg.webapp.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.util.time.Interval;

/**
 * Request for selecting data from streams.
 */
public class SelectRequest extends BaseRequest {

    /**
     * Specified streams to be subscribed. At least one stream name should be defineds.
     */

    @DocumentationExample(value = "ticks")
    @JsonProperty
    public String[]             streams;

    /**
     * Specified message types to be subscribed. If undefined, then all types will be subscribed.
     */
    @DocumentationExample(value = "deltix.timebase.api.messages.L2Message", value2 = "deltix.timebase.api.messages.universal.PackageHeader")
    @JsonProperty
    public String[]             types;

    /**
     * Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = "AAPL", value2 = "GOOG")
    @JsonProperty
    public String[]             symbols;

    /**
     * Specified time history depth to be subscribed. For direct selection
     */
    @DocumentationExample(value = "1H", value2 = "5H")
    @JsonProperty
    public String               depth;

    @Override
    public long         getStartTime(long currentTime) {
        long ts = Long.MIN_VALUE;

        Interval iDepth = Interval.valueOf(depth);

        if (from != null) {
            ts = from.toEpochMilli();
        } else {
            if (depth != null)
                ts = (to == null ? currentTime : to.toEpochMilli()) - iDepth.toMilliseconds();
        }

        return ts;
    }
}
