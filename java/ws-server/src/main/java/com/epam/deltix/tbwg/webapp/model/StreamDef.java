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
package com.epam.deltix.tbwg.webapp.model;

import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Created by Alex Karpovich on 9/10/2018.
 */
public class StreamDef {

    public StreamDef(String key, String name, int symbols) {
        this.name = name != null ? name : key;
        this.key = key;
        this.symbols = symbols;
    }

    @JsonProperty
    public String       name;

    @JsonProperty
    public String       key;

    @JsonProperty
    public int          symbols;

    @JsonProperty
    public ChartType[]  chartType;
}
