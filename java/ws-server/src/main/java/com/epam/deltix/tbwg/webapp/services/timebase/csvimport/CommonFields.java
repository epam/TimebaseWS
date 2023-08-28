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

package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.tbwg.webapp.model.input.StreamFieldInfo;
import com.epam.deltix.tbwg.webapp.model.schema.DataTypeDef;
import com.epam.deltix.tbwg.webapp.model.schema.SchemaBuilder;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public enum CommonFields {

    KEYWORD(new StreamFieldInfo("keyword", null, "Keyword",
            new DataTypeDef("VARCHAR", "UTF8", false)),
            new VarcharDataType("UTF8", false, false)),
    SYMBOL(new StreamFieldInfo("symbol", null, "Symbol",
            new DataTypeDef("VARCHAR", "UTF8", false)),
            new VarcharDataType("UTF8", false, false)),

    TIMESTAMP(new StreamFieldInfo("timestamp", null, "Date/Time",
            new DataTypeDef("TIMESTAMP", null, false)),
            new DateTimeDataType(false));

    private static final Map<StreamFieldInfo, CommonFields> BY_FIELD_INFO = new HashMap<>();

    static {
        for (CommonFields e : values()) {
            BY_FIELD_INFO.put(e.fieldInfo, e);
        }
    }

    private final StreamFieldInfo fieldInfo;
    private final DataType type;

    CommonFields(StreamFieldInfo fieldInfo, DataType type) {
        this.fieldInfo = fieldInfo;
        this.type = type;
    }

    public static CommonFields valueOfFieldInfo(StreamFieldInfo fieldInfo) {
        return BY_FIELD_INFO.get(fieldInfo);
    }

    public static boolean isCommonField(StreamFieldInfo fieldInfo) {
        return Arrays.stream(values())
                .anyMatch(commonFields -> commonFields.getFieldInfo().equals(fieldInfo));
    }

    public StreamFieldInfo getFieldInfo() {
        return fieldInfo;
    }

    public DataType getType() {
        return type;
    }
}
