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

package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;
import com.epam.deltix.qsrv.hf.tickdb.pub.LoadingOptions;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.*;

import static com.epam.deltix.tbwg.webapp.utils.DateFormatter.DATETIME_MILLIS_FORMAT_STR;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CsvImportGeneralSettings {

    @DocumentationExample(value = "stream_name")
    @JsonProperty
    private String streamKey;

    /**
     * Separator to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = ",")
    @JsonProperty
    private char separator = ',';

    @DocumentationExample(value = "false")
    @JsonProperty
    private boolean fileBySymbol;

    @DocumentationExample(value = "false")
    @JsonProperty
    private boolean globalSorting;

    /**
     * Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     */
    @DocumentationExample(value = "BTCEUR", value2 = "ETHEUR")
    @JsonProperty
    private String[] symbols;

    @DocumentationExample(value = "REWRITE")
    @JsonProperty
    private LoadingOptions.WriteMode writeMode = LoadingOptions.WriteMode.APPEND;

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    private Instant startTime;

    /**
     * The end timestamp in UTC (inclusive), for example 2018-06-28T00:00:00.123Z
     */
    @DocumentationExample("2018-06-30T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    private Instant endTime;

    @DocumentationExample("2")
    @JsonProperty
    private int startImportRow = 2;

    @JsonProperty
    private String charset = "UTF-8";

    @DocumentationExample(value = "", value2 = "empty")
    @JsonProperty
    private Set<String> nullValues = new HashSet<>() {{
        add("");
    }};

    @DocumentationExample("SKIP")
    @JsonProperty
    private UnmatchedKeywordType strategy = UnmatchedKeywordType.SKIP;
    @JsonProperty
    private Map<String, String> typeToKeywordMapping;

    @DocumentationExample("MM/dd/yyyy HH:mm:ss")
    @JsonProperty
    private String dataTimeFormat;
    @DocumentationExample("America/New_York")
    @JsonProperty
    private String timeZone;
}



