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

/**
 * Created by Alex Karpovich on 22/06/2021.
 */
public class TypeSelection {

    public TypeSelection() {
    }

    public TypeSelection(String name) {
        this.name = name;
    }

    /**
     * Type Name
     */
    @DocumentationExample(value = "deltix.timebase.api.messages.TradeMessage", value2 = "deltix.timebase.api.messages.BestBidOfferMessage")
    @JsonProperty
    public String       name;

    /**
     * Selected fields, null means ALL fields
     */
    @DocumentationExample(value = "size")
    @JsonProperty
    public String[]     fields;
}
