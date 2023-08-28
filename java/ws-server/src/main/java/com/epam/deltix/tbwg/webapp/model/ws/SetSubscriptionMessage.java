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
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.time.Instant;
import java.util.List;

import static com.epam.deltix.tbwg.webapp.utils.DateFormatter.DATETIME_MILLIS_FORMAT_STR;

public class SetSubscriptionMessage extends WSMessage {

    public SetSubscriptionMessage() {
        super(MessageType.SET_SUBSCRIPTION);
    }

    @DocumentationExample("2018-06-28T09:30:00.123Z")
    @JsonProperty
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = DATETIME_MILLIS_FORMAT_STR, timezone = "UTC")
    public Instant from = Instant.ofEpochMilli(Long.MIN_VALUE);

    /**
     * If empty or null - subscribe to all
     */
    @JsonProperty
    public List<String> symbols = new ObjectArrayList<>();

    /**
     * If empty or null - subscribe to all
     */
    @JsonProperty
    public List<String> types = new ObjectArrayList<>();

    @Override
    public String toString() {
        return "SetSubscriptionMessage{" +
                "from=" + from +
                ", symbols=" + symbols +
                ", types=" + types +
                '}';
    }
}
