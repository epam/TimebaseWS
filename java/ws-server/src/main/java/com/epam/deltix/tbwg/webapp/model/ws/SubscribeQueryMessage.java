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
package com.epam.deltix.tbwg.webapp.model.ws;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static com.epam.deltix.tbwg.webapp.utils.DateFormatter.DATETIME_MILLIS_FORMAT_STR;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/21/2019
 */
public class SubscribeQueryMessage extends WSMessage {

    public SubscribeQueryMessage() {
        super(MessageType.SUBSCRIBE_QUERY);
    }

    /**
     * The start timestamp in UTC (inclusive), for example 2018-06-28T09:30:00.123Z;
     * If timestamp is not specified (null), current timestamp will be used for live,
     * and Long.MIN_VALUE for historical.
     */
    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from = Instant.ofEpochMilli(Long.MIN_VALUE);

    /**
     * Whether the query will be selected in live mode (awaits for live data).
     */
    @DocumentationExample("true")
    @JsonProperty
    public boolean live = false;

    /**
     * QQL query to select data.
     */
    @DocumentationExample("SELECT * FROM KRAKEN")
    @JsonProperty
    public String query;

    /**
     * Specified symbols need to be subscribed.
     * If undefined, subscribe to all symbols.
     */
    @JsonProperty
    public List<String> symbols;

    /**
     * Specified message types to be subscribed.
     * If undefined, subscribe to all types.
     */
    @JsonProperty
    public List<String> types;

    @Override
    public String toString() {
        return "SubscribeMessage{" +
                "from=" + from +
                ", live=" + live +
                ", query=" + query +
                ", symbols=" + (symbols != null ? Arrays.toString(symbols.toArray(new String[0])) : "[]") +
                ", types=" + (types != null ? Arrays.toString(types.toArray(new String[0])) : "[]") +
                '}';
    }
}
