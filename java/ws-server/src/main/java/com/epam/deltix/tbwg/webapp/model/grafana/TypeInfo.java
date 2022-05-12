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
package com.epam.deltix.tbwg.webapp.model.grafana;

import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.computations.data.base.ValueType;

import java.util.Arrays;
import java.util.List;

public class TypeInfo {

    private String type;

    private List<FieldInfo> fields;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<FieldInfo> getFields() {
        return fields;
    }

    public void setFields(List<FieldInfo> fields) {
        this.fields = fields;
    }

    public static class FieldInfo {

        private String name;
        private FieldType fieldType;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public FieldType getFieldType() {
            return fieldType;
        }

        public void setFieldType(FieldType fieldType) {
            this.fieldType = fieldType;
        }
    }

    public static class FieldType {

        protected ValueType dataType;

        public ValueType getDataType() {
            return dataType;
        }

        public void setDataType(ValueType dataType) {
            this.dataType = dataType;
        }
    }

    public static class EnumFieldType extends FieldType {

        protected List<String> values;

        public List<String> getValues() {
            return values;
        }

        public void setValues(List<String> values) {
            this.values = values;
        }
    }

    public static FieldType fieldType(DataType type) {
        if (type instanceof EnumDataType) {
            EnumDataType enumDataType = (EnumDataType) type;
            EnumFieldType enumFieldType = new EnumFieldType();
            enumFieldType.setDataType(ValueType.ENUM);
            enumFieldType.setValues(Arrays.asList(enumDataType.descriptor.getSymbols()));
            return enumFieldType;
        } else {
            FieldType fieldType = new FieldType();
            fieldType.setDataType(type(type));
            return fieldType;
        }
    }

    public static ValueType type(DataType type) {
        if (type instanceof IntegerDataType) {
            int size = ((IntegerDataType) type).getNativeTypeSize();
            if (size >= 6) {
                return ValueType.LONG;
            } else if (size == 4) {
                return ValueType.INT;
            } else if (size == 2) {
                return ValueType.SHORT;
            } else if (size == 1) {
                return ValueType.BYTE;
            }
        } else if (type instanceof FloatDataType) {
            FloatDataType fType = (FloatDataType) type;
            if (fType.isFloat()) {
                return ValueType.FLOAT;
            } else if (fType.isDecimal64()) {
                return ValueType.DECIMAL64;
            } else {
                return ValueType.DOUBLE;
            }
        } else if (type instanceof BooleanDataType) {
            return ValueType.BOOLEAN;
        } else if (type instanceof EnumDataType) {
            return ValueType.ENUM;
        } else if (type instanceof DateTimeDataType) {
            return ValueType.DATETIME;
        } else if (type instanceof VarcharDataType) {
            return ValueType.VARCHAR;
        } else if (type instanceof CharDataType) {
            return ValueType.CHAR;
        } else if (type instanceof TimeOfDayDataType) {
            return ValueType.TIMEOFDAY;
        }
        throw new IllegalArgumentException("Unsupported type " + type.getClass().getSimpleName());
    }

}
