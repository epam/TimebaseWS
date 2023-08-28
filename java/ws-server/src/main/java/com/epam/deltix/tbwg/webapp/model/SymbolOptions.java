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
package com.epam.deltix.tbwg.webapp.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.pub.StreamScope;
import lombok.Data;

@Data
public class SymbolOptions {

    public SymbolOptions(StreamOptionsDef streamOptions) {
        streamKey = streamOptions.key;
        streamName = streamOptions.name;
        description = streamOptions.description;
        distributionFactor = streamOptions.distributionFactor;
        scope = streamOptions.scope;
        periodicity = streamOptions.periodicity;
        highAvailability = streamOptions.highAvailability;
        owner = streamOptions.owner;
        streamRange = streamOptions.range;
        version = streamOptions.version;
    }

    @JsonProperty
    private String streamKey;

    @JsonProperty
    private String streamName;

    @JsonProperty
    private String symbolName;

    @JsonProperty
    private String description;

    @JsonProperty
    private String distributionFactor;

    @JsonProperty
    private StreamScope scope;

    @JsonProperty
    private PeriodicityDef  periodicity;

    @JsonProperty
    private boolean highAvailability;

    @JsonProperty
    private String owner;

    @JsonProperty
    private String version;

    @JsonProperty
    private TimeRangeDef streamRange;

    @JsonProperty
    private TimeRangeDef symbolRange;

}
