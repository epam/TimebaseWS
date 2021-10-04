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
package com.epam.deltix.grafana.model.fields;

import javax.annotation.Nonnull;

public class MutableField implements Field {

    private String name;
    private FieldType fieldType = FieldType.OTHER;
    private final FieldConfig config;

    public MutableField() {
        this.config = new FieldConfig();
    }

    public MutableField(String name, FieldType fieldType) {
        this.name = name;
        this.fieldType = fieldType;
        this.config = new FieldConfig();
    }

    public MutableField(String name, FieldType fieldType, FieldConfig config) {
        this.name = name;
        this.fieldType = fieldType;
        this.config = config;
    }

    @Nonnull
    @Override
    public String name() {
        return name;
    }

    @Nonnull
    @Override
    public FieldType type() {
        return fieldType;
    }

    @Nonnull
    @Override
    public FieldConfig config() {
        return config;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setFieldType(FieldType fieldType) {
        this.fieldType = fieldType;
    }
}
