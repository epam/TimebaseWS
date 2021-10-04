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
package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.computations.data.base.ValueType;

public enum GrafanaValueType {
    LONG(ValueType.LONG),
    INT(ValueType.INT),
    SHORT(ValueType.SHORT),
    BYTE(ValueType.BYTE),
    FLOAT(ValueType.FLOAT),
    DOUBLE(ValueType.DOUBLE),
    DECIMAL64(ValueType.DECIMAL64),
    BOOLEAN(ValueType.BOOLEAN),
    ENUM(ValueType.ENUM),
    VARCHAR(ValueType.VARCHAR),
    CHAR(ValueType.CHAR),
    DATETIME(ValueType.DATETIME),
    TIMEOFDAY(ValueType.TIMEOFDAY),
    OBJECT(ValueType.OBJECT),
    ARRAY(ValueType.ARRAY),
    NUMERIC(ValueType.LONG, ValueType.INT, ValueType.SHORT, ValueType.BYTE, ValueType.FLOAT, ValueType.DOUBLE, ValueType.DECIMAL64),
    ANY(ValueType.values());

    private final ValueType[] types;

    GrafanaValueType(final ValueType ... types) {
        this.types = types;
    }

    public ValueType[] getTypes() {
        return types;
    }
}
