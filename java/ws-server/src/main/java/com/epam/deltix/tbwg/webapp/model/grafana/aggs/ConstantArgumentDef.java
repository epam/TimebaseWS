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
package com.epam.deltix.tbwg.webapp.model.grafana.aggs;

import com.epam.deltix.util.lang.StringUtils;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.computations.data.base.ArgumentType;
import com.epam.deltix.grafana.base.annotations.ConstantArgument;

public class ConstantArgumentDef {

    private String name;
    private ArgumentType type;
    private String defaultValue;
    private String min;
    private String max;
    private String doc;

    @JsonProperty(value = "id")
    public String getId() {
        return String.format("%s:%s", name, type);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ArgumentType getType() {
        return type;
    }

    public void setType(ArgumentType type) {
        this.type = type;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public String getMin() {
        return min;
    }

    public void setMin(String min) {
        this.min = min;
    }

    public String getMax() {
        return max;
    }

    public void setMax(String max) {
        this.max = max;
    }

    public String getDoc() {
        return doc;
    }

    public void setDoc(String doc) {
        this.doc = doc;
    }

    public static ConstantArgumentDef create(ConstantArgument argument) {
        ConstantArgumentDef argumentDef = new ConstantArgumentDef();
        argumentDef.setName(argument.name());
        argumentDef.setType(argument.type());
        argumentDef.setDoc(argument.doc());
        argumentDef.setMax(StringUtils.isEmpty(argument.max()) ? null: argument.max());
        argumentDef.setMin(StringUtils.isEmpty(argument.min()) ? null: argument.min());
        argumentDef.setDefaultValue(StringUtils.isEmpty(argument.defaultValue()) ? null: argument.defaultValue());
        return argumentDef;
    }
}
