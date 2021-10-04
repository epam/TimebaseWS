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
package com.epam.deltix.grafana.data;

import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.grafana.model.fields.FieldConfig;
import com.epam.deltix.grafana.model.fields.FieldType;

import javax.annotation.Nonnull;

public class NumericField implements Field {

    private String name;
    private final FieldConfig fieldConfig;

    public NumericField() {
        this(null);
    }

    public NumericField(String name) {
        this(name, new FieldConfig());
    }

    public NumericField(String name, FieldConfig fieldConfig) {
        this.name = name;
        this.fieldConfig = fieldConfig;
    }

    @Nonnull
    @Override
    public String name() {
        return name;
    }

    @Nonnull
    @Override
    public FieldType type() {
        return FieldType.NUMBER;
    }

    @Nonnull
    @Override
    public FieldConfig config() {
        return fieldConfig;
    }

    public void setName(String name) {
        this.name = name;
    }
}
