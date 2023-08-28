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

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;

import static com.epam.deltix.tbwg.webapp.utils.DateFormatter.DATETIME_MILLIS_FORMAT_STR;

/**
 * Request for order book snapshot.
 */
public class OrderBookRequest {

    /**
     * Specified symbol to build snapshot.
     */
    @DocumentationExample(value = "BTC/USD")
    @JsonProperty
    public String               symbol;

    /**
     * The start timestamp of filter in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant              from;

    /**
     * Start row offset of filter. (By default = 0)
     */
    @DocumentationExample("0")
    @JsonProperty
    public long                 offset = 0;

    /**
     * Specified streams of filter.
     */
    @DocumentationExample(value = "ticks")
    @JsonProperty
    public String[]             streams;

    /**
     * Specified message types of filter.
     */
    @DocumentationExample(value = "deltix.timebase.api.messages.L2Message", value2 = "deltix.timebase.api.messages.universal.PackageHeader")
    @JsonProperty
    public String[]             types;

    /**
     * Specified instruments(symbols) of filter.
     */
    @DocumentationExample(value = "AAPL", value2 = "GOOG")
    @JsonProperty
    public String[]             symbols;

    /**
     * Order of filter's messages.
     */
    @DocumentationExample("false")
    @JsonProperty
    public boolean              reverse = false;

    /**
     * Specified space (partition) of filter.
     */
    @DocumentationExample(value = "partition1")
    @JsonProperty
    public String               space;


}
