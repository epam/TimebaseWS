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

import com.epam.deltix.grafana.model.fields.Column;
import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class MutableDataFrameImpl implements MutableDataFrame {

    @JsonIgnore
    private final String name;

    @JsonIgnore
    private final Map<String, Column> fields = new HashMap<>();

    @JsonIgnore
    private int length = 0;

    public MutableDataFrameImpl(String name) {
        this.name = name;
    }

    @Nullable
    @Override
    public String getName() {
        return name;
    }

    @Nonnull
    @Override
    public Collection<Column> getFields() {
        return fields.values();
    }

    @Override
    public int getLength() {
        return length;
    }

    @Override
    public void addColumn(Column column) {
        if (length != 0 && column.values().size() > length) {
            throw new RuntimeException();
        }
        fields.put(column.name(), column);
        for (int i = 0; i < length - column.values().size(); i++) {
            column.values().add(null);
        }
        length = Math.max(column.values().size(), length);
    }

    @Override
    public boolean hasColumn(String column) {
        return fields.containsKey(column);
    }

    @Override
    public void append(Object[] values) {

    }

    @Override
    public void insert(int index, Object[] values) {

    }

    @Override
    public void remove(int index) {

    }
}
