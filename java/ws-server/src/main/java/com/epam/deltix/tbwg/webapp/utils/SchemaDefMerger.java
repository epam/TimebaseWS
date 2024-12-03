/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.md.FloatDataType;
import com.epam.deltix.qsrv.hf.pub.md.VarcharDataType;
import com.epam.deltix.qsrv.hf.pub.md.json.*;

import java.util.*;
import java.util.stream.Collectors;

public class SchemaDefMerger {

    private static final String VARCHAR_DT_NAME = "VARCHAR";
    private static final String INTEGER_DT_NAME = "INTEGER";
    private static final String FLOAT_DT_NAME = "FLOAT";

    public TypeDef mergeTypes(TypeDef t1, TypeDef t2) {
        if (t1 == null) {
            return t2;
        } else if (t2 == null) {
            return t1;
        } else if (t1.equals(t2)) {
            return t1;
        }

        TypeDef result = new TypeDef();
        result.setName(getMergedString(t1.getName(), t2.getName()));
        result.setTitle(getMergedString(t1.getTitle(), t2.getTitle()));
        result.setParent(getMergedString(t1.getParent(), t2.getParent()));
        result.setFields(mergeFields(t1.getFields(), t2.getFields()));
        return result;
    }

    public FieldDef[] mergeFields(FieldDef[] fields1, FieldDef[] fields2) {
        Map<String, FieldDef> fm1 = getFieldsMap(fields1);
        Map<String, FieldDef> fm2 = getFieldsMap(fields2);

        Map<String, FieldDef> result = new HashMap<>();
        for (String fieldName : fm1.keySet()) {
            if (fm2.containsKey(fieldName)) {
                result.put(fieldName, mergeField(fm1.get(fieldName), fm2.get(fieldName)));
            } else {
                result.put(fieldName, fm1.get(fieldName));
            }
        }
        for (String fieldName : fm2.keySet()) {
            if (!result.containsKey(fieldName)) {
                result.put(fieldName, fm2.get(fieldName));
            }
        }
        return result.values().toArray(FieldDef[]::new);
    }

    public FieldDef mergeField(FieldDef f1, FieldDef f2) {
        if (f1 == null) {
            return f2;
        } else if (f2 == null) {
            return f1;
        } else if (f1.equals(f2)) {
            return f1;
        }

        FieldDef result = new FieldDef();
        result.setType(mergeDataTypes(f1.getType(), f2.getType()));
        result.setName(f1.getName());
        result.setDescription(getMergedString(f1.getDescription(), f2.getDescription()));
        result.setTitle(getMergedString(f1.getTitle(), f2.getTitle()));
        return result;
    }

    public DataTypeDef mergeDataTypes(DataTypeDef t1, DataTypeDef t2) {
        if (t1 == null) {
            return t2;
        } else if (t2 == null) {
            return t1;
        } else if (t1.equals(t2)) {
            return t1;
        }

        if (t1.getName().equals(VARCHAR_DT_NAME) || t2.getName().equals(VARCHAR_DT_NAME)) {
            return new DataTypeDef(VARCHAR_DT_NAME, VarcharDataType.ENCODING_INLINE_VARSIZE, t1.isNullable() || t2.isNullable());
        }
        if (t1.getName().equals(t2.getName())) {
            DataTypeDef dataType = new DataTypeDef();
            dataType.setName(t1.getName());
            //in this case only types with the same encoding are used
            dataType.setEncoding(t1.getEncoding());
            dataType.setNullable(t1.isNullable() || t2.isNullable());
            dataType.setElementType(mergeDataTypes(t1.getElementType(), t2.getElementType()));
            dataType.setTypes(mergeObjectTypes(t1.getTypes(), t2.getTypes()));
            return dataType;
        } else if (t1.getName().equals(FLOAT_DT_NAME) && t2.getName().equals(INTEGER_DT_NAME) ||
                t1.getName().equals(INTEGER_DT_NAME) && t2.getName().equals(FLOAT_DT_NAME)) {
            return new DataTypeDef(FLOAT_DT_NAME, FloatDataType.ENCODING_DECIMAL64, t1.isNullable() || t2.isNullable());
        }
        return new DataTypeDef(VARCHAR_DT_NAME, VarcharDataType.ENCODING_INLINE_VARSIZE, t1.isNullable() || t2.isNullable());
    }

    private List<String> mergeObjectTypes(List<String> types1, List<String> types2) {
        if (types1 == null) {
            return types2;
        } else if (types2 == null) {
            return types1;
        }

        List<String> result = new ArrayList<>(types1);
        for (String type : types2) {
            if (!result.contains(type)) {
                result.add(type);
            }
        }
        return result;
    }

    private Map<String, FieldDef> getFieldsMap(FieldDef[] fields) {
        return Arrays.stream(fields).collect(Collectors.toMap(FieldDef::getName, fieldDef -> fieldDef));
    }

    private String getMergedString(String s1, String s2) {
        if (s1 == null) {
            return s2;
        } else if (s2 == null) {
            return s1;
        } else if (s1.length() > s2.length()) {
            return s1;
        }
        return s2;
    }

}