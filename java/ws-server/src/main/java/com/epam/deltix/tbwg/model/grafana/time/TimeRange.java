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
package com.epam.deltix.tbwg.model.grafana.time;

import com.epam.deltix.tbwg.utils.DateFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;

public class TimeRange {

    @DocumentationExample("2016-10-31T06:33:44.866Z")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    @JsonProperty
    protected Instant from;

    @DocumentationExample("2016-10-31T12:33:44.866Z")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DateFormatter.DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    @JsonProperty
    protected Instant to;

    @JsonProperty
    protected RawTimeRange raw;

    public Instant getFrom() {
        return from;
    }

    public void setFrom(Instant from) {
        this.from = from;
    }

    public Instant getTo() {
        return to;
    }

    public void setTo(Instant to) {
        this.to = to;
    }

    public RawTimeRange getRaw() {
        return raw;
    }

    public void setRaw(RawTimeRange raw) {
        this.raw = raw;
    }
}
