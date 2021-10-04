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
package com.epam.deltix.tbwg.model.grafana.aggs;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class FieldArgumentDef {

    private String name;
    private List<ValueType> types;
    private String doc;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<ValueType> getTypes() {
        return types;
    }

    public void setTypes(List<ValueType> types) {
        this.types = types;
    }

    public String getDoc() {
        return doc;
    }

    public void setDoc(String doc) {
        this.doc = doc;
    }

    public static FieldArgumentDef create(FieldArgument fieldArgument) {
        FieldArgumentDef fieldArgumentDef = new FieldArgumentDef();
        fieldArgumentDef.setName(fieldArgument.name());
        fieldArgumentDef.setDoc(fieldArgument.doc());
        fieldArgumentDef.setTypes(Arrays.stream(fieldArgument.types())
                .flatMap(type -> Arrays.stream(type.getTypes()))
                .distinct()
                .collect(Collectors.toList())
        );
        return fieldArgumentDef;
    }

    @JsonProperty(value = "id")
    public String getId() {
        return String.format("%s:%s", name, types);
    }
}
