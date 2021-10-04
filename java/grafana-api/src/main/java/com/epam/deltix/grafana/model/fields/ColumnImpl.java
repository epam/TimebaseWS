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
import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ColumnImpl implements Column {

    @Nonnull
    protected final String name;

    @Nonnull
    protected final FieldType type;

    @Nonnull
    protected final FieldConfig config;

    @Nonnull
    protected final List<Object> values;

    @Nonnull
    protected final Map<String, String> labels = new HashMap<>();

    public ColumnImpl(@Nonnull String name,
                      @Nonnull FieldType type,
                      @Nonnull FieldConfig config,
                      @Nonnull List<Object> values) {
        this.name = name;
        this.type = type;
        this.config = config;
        this.values = values;
    }

    public ColumnImpl(@Nonnull String name,
                      @Nonnull FieldType type) {
        this.name = name;
        this.type = type;
        this.config = new FieldConfig();
        this.values = new ArrayList<>();
    }

    @Nonnull
    @Override
    public List<Object> values() {
        return values;
    }

    @Nullable
    @Override
    public Map<String, String> labels() {
        return labels;
    }

    @Nonnull
    @Override
    public String name() {
        return name;
    }

    @Nonnull
    @Override
    public FieldType type() {
        return type;
    }

    @Nonnull
    @Override
    public FieldConfig config() {
        return config;
    }
}
