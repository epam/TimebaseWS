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
package com.epam.deltix.tbwg.webapp.model.input;

import com.epam.deltix.tbwg.webapp.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;

public class ImportRequest {

    @DocumentationExample(value = "myfile.qsmsg.gz")
    @JsonProperty
    public String fileName;

    @DocumentationExample(value = "1234992")
    @JsonProperty
    public long fileSize;

    @DocumentationExample(value = "my_new_stream")
    @JsonProperty
    public String stream;

    @DocumentationExample(value = "My awesome steam")
    @JsonProperty
    public String description;

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from;

    /**
     * The end timestamp in UTC (inclusive), for example 2018-06-28T00:00:00.123Z
     */
    @DocumentationExample("2018-06-30T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant to;

    @JsonProperty
    public ExportMode mode = ExportMode.SINGLE_FILE;

    /**
     * Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = "BTCEUR", value2 = "ETHEUR")
    @JsonProperty
    public String[] symbols;

    @JsonProperty
    public PeriodicityRequest periodicity;

}
