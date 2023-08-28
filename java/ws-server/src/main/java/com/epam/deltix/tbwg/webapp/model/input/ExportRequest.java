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
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService;

import java.time.Instant;
import java.util.stream.Stream;

import static com.epam.deltix.tbwg.webapp.utils.DateFormatter.DATETIME_MILLIS_FORMAT_STR;

public class ExportRequest {

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from;

    /**
     * The end timestamp in UTC (inclusive), for example 2018-06-28T00:00:00.123Z
     */
    @DocumentationExample("2018-06-30T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant to;

    /**
     * Start row offset. (By default = 0)
     */
    @DocumentationExample("0")
    @JsonProperty
    public long offset = 0;

    /**
     * Number of returning rows. (By default = -1, means all rows must be selected)
     */
    @DocumentationExample("1000")
    @JsonProperty
    public int rows = -1;

    /**
     * Result order of messages
     */
    @DocumentationExample("false")
    @JsonProperty
    public boolean reverse = false;

    @JsonIgnore
    public long getStartTime(long currentTime) {
        return from != null ? from.toEpochMilli() : Long.MIN_VALUE;
    }

    @JsonIgnore
    public long getEndTime() {
        return to != null ? to.toEpochMilli() : Long.MAX_VALUE;
    }

    /**
     * Specified message types to be subscribed. If undefined, then all types will be subscribed.
     */
    @JsonProperty
    public TypeSelection[] types;

    /**
     * Specified export format
     */
    @JsonProperty
    public ExportFormat format;

    /**
     * Values separator in case of CSV export format. ',' by default
     */
    @JsonProperty
    public String valueSeparator = ",";

    @JsonProperty
    public ExportMode mode = ExportMode.SINGLE_FILE;

    /**
     * Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = "BTCEUR", value2 = "ETHEUR")
    @JsonProperty
    public String[] symbols;

    /**
     * Does not export empty spaces/symbols
     */
    @DocumentationExample("false")
    @JsonProperty
    public boolean skipEmpty = false;

    /**
     * Determines whether static fields will be included in the CSV export.
     * True by default
     * For qsmsg, this is always true
     */
    @DocumentationExample("false")
    @JsonProperty
    public boolean enableStaticFields = true;

    /**
     * The pattern string of this formatter. "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'" by default.
     */
    @JsonProperty
    @DocumentationExample("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    public String datetimeFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    /**
     * Return timebase type name for selection
     *
     * @return String names
     */
    @JsonIgnore
    public String[] getTypes() {
        return types != null ? Stream.of(types).map(x -> x.name).toArray(String[]::new) : null;
    }

    @JsonIgnore
    public void setTypes(String[] names) {
        if (names == null) {
            types = null;
        } else {
            types = new TypeSelection[names.length];
            for (int i = 0; i < names.length; i++)
                types[i] = new TypeSelection(names[i]);
        }
    }

    @JsonIgnore
    public String getFileName(String name) {
        if (format == ExportFormat.CSV) {
            return name + ".zip";
        } else {
            if (mode == ExportMode.FILE_PER_SYMBOL || mode == ExportMode.FILE_PER_SPACE) {
                return name + ".zip";
            } else {
                return name + ExportService.MSG_FORMAT;
            }
        }
    }

}
