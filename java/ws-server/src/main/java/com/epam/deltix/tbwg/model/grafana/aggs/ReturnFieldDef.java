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
import com.epam.deltix.grafana.base.annotations.ReturnField;
import org.springframework.util.StringUtils;

public class ReturnFieldDef {

    private ValueType type;
    private String constantName;

    public ValueType getType() {
        return type;
    }

    public void setType(ValueType type) {
        this.type = type;
    }

    public String getConstantName() {
        return constantName;
    }

    public void setConstantName(String constantName) {
        this.constantName = constantName;
    }

    @JsonProperty(value = "id")
    public String getId() {
        return String.format("{%s:%s}", type, constantName);
    }

    public static ReturnFieldDef create(ReturnField returnField) {
        ReturnFieldDef returnFieldDef = new ReturnFieldDef();
        returnFieldDef.setConstantName(StringUtils.isEmpty(returnField.constantName()) ? null: returnField.constantName());
        returnFieldDef.setType(returnField.value());
        return returnFieldDef;
    }
}
