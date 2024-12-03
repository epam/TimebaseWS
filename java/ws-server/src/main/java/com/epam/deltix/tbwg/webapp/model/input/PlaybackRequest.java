/*
 * Copyright 2024 EPAM Systems, Inc
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
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

import static com.epam.deltix.tbwg.webapp.utils.DateFormatter.DATETIME_MILLIS_FORMAT_STR;

@Getter @Setter
public class PlaybackRequest {

    @DocumentationExample(value = "first_stream", value2 = "second_stream")
    @JsonProperty
    private String[] sourceStreams;

    @DocumentationExample(value = "target_stream")
    @JsonProperty
    private String targetStream;

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    private Instant from;

    /**
     * The end timestamp in UTC (inclusive), for example 2018-06-28T00:00:00.123Z
     */
    @DocumentationExample("2018-06-30T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    private Instant to;

    /**
     * Sets time speed. For realtime player means less time to wait between messages.
     */
    @DocumentationExample("1")
    @JsonProperty
    private double speed = 1;

    /**
     * Enables cyclic playback mode. In cyclic mode if source stream ends (depletes) it will be restarted.
     */
    @DocumentationExample("false")
    @JsonProperty
    private boolean cyclic = false;

    /**
     * Playback will occur in the topic.
     */
    @DocumentationExample("false")
    @JsonProperty
    private boolean targetTopic = false;

    /**
     * Will the Playback be active in the background even if all interaction windows are closed.
     */
    @DocumentationExample("false")
    @JsonProperty
    private boolean permanent = false;

}