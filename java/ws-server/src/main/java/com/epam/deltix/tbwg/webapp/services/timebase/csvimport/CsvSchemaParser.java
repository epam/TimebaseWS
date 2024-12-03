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
package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;


import com.epam.deltix.qsrv.hf.pub.md.json.*;
import com.google.gson.*;
import com.epam.deltix.qsrv.hf.pub.md.*;

import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;
import com.epam.deltix.tbwg.webapp.utils.DateFormatter;
import com.epam.deltix.tbwg.webapp.utils.SchemaDefMerger;
import com.epam.deltix.tbwg.webapp.utils.TextUtils;

import java.io.*;
import java.lang.reflect.Type;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.epam.deltix.qsrv.hf.pub.RawMessageManipulator.OBJECT_CLASS_NAME;
import static com.epam.deltix.qsrv.hf.pub.md.DataType.*;
import static com.epam.deltix.tbwg.webapp.utils.CsvImportUtil.DEFAULT_DATETIME_COLUMN_NAME;
import static com.epam.deltix.tbwg.webapp.utils.CsvImportUtil.DEFAULT_TIMESTAMP_COLUMN_NAME;
import static com.epam.deltix.util.lang.Util.getSimpleName;

public class CsvSchemaParser {


    final static Map<Integer, String> TYPES = new HashMap<>() {
        {
            put(T_BINARY_TYPE, "BINARY");
            put(T_DATE_TIME_TYPE, "TIMESTAMP");
            put(T_BOOLEAN_TYPE, "BOOLEAN");
            put(T_TIME_OF_DAY_TYPE, "TIMEOFDAY");
            put(T_INTEGER_TYPE, "INTEGER");
            put(T_FLOAT_TYPE, "FLOAT");
        }
    };

    final static Map<Integer, String> ENCODINGS = new HashMap<>() {
        {
            put(T_DATE_TIME_TYPE, DateTimeDataType.ENCODING_NANOSECONDS);
            put(T_INTEGER_TYPE, IntegerDataType.ENCODING_INT64);
            put(T_FLOAT_TYPE, FloatDataType.ENCODING_DECIMAL64);
        }
    };

    private final Map<Integer, DataType> dataTypesForParsing = new HashMap<>() {
        {
            put(T_BOOLEAN_TYPE, new BooleanDataType(true));
            put(T_TIME_OF_DAY_TYPE, new TimeOfDayDataType(true));
            put(T_FLOAT_TYPE, new FloatDataType(FloatDataType.ENCODING_DECIMAL64, true));
        }
    };
    private static final String VARCHAR_DT_NAME = "VARCHAR";
    public static final String ENUM_REGEX = "^[a-zA-Z][a-zA-Z0-9_$]*$";
    private final Gson jsonFormatter = new GsonBuilder()
            .setObjectToNumberStrategy(ToNumberPolicy.LONG_OR_DOUBLE)
            .registerTypeAdapter(Map.class, new MapJsonDeserializer())
            .registerTypeAdapter(List.class, new ListJsonDeserializer())
            .create();
    private final char separator;
    private final String charset;
    private final boolean enumCheck;
    private final int enumValuesCount;
    private final int enumRepeatRate;
    private final boolean staticCheck;
    private final boolean removeNsEncoding;
    private final DateFormatter dateFormatter;
    private final DateFormatter nsDateFormatter;
    private int keywordIndex = -1;
    private final Map<String, TypeDef> all = new HashMap<>();
    private final List<TypeDef> types = new ArrayList<>();
    private final Map<TypeDef, String> enums = new HashMap<>();
    private Map<Integer, CsvFieldInfo> indexToField;
    private int headersLength = -1;
    private final Map<String, Set<Integer>> hierarchy = new HashMap<>();
    private final SchemaDefMerger merger = new SchemaDefMerger();
    private int enumTypeCount;

    public CsvSchemaParser(CsvImportGeneralSettings settings, boolean enumCheck, int enumValuesCount, int enumRepeatRate, boolean staticCheck, boolean removeNsEncoding) {
        this(settings.getSeparator(), settings.getCharset(), settings.getDataTimeFormat(), enumCheck, enumValuesCount, enumRepeatRate, staticCheck, removeNsEncoding);
    }

    public CsvSchemaParser(char separator, String charset, String dateFormate, boolean enumCheck, boolean staticCheck, boolean removeNsEncoding) {
        this(separator, charset, dateFormate, enumCheck, 20, 10, staticCheck, removeNsEncoding);
    }

    public CsvSchemaParser(char separator, String charset, String dateFormate, boolean enumCheck, int enumValuesCount, int enumRepeatRate, boolean staticCheck, boolean removeNsEncoding) {
        this.separator = separator;
        this.charset = charset;
        this.staticCheck = staticCheck;
        this.enumCheck = enumCheck;
        this.enumValuesCount = enumValuesCount;
        this.enumRepeatRate = enumRepeatRate;
        this.removeNsEncoding = removeNsEncoding;
        if (CsvImportUtil.isNsFormat(dateFormate)) {
            dateFormatter = new DateFormatter(CsvImportUtil.toMsFormat(dateFormate));
            nsDateFormatter = new DateFormatter(dateFormate);
        } else {
            dateFormatter = new DateFormatter(dateFormate);
            nsDateFormatter = new DateFormatter(CsvImportUtil.toNsFormat(dateFormate));
        }
    }

    public void processFile(File file) {
        try (FileInputStream fileInputStream = new FileInputStream(file);
             CsvLineReader reader = new CsvLineReader(fileInputStream, separator, charset, file.getName())) {
            processHeaders(reader.getHeaders());
            while (true) {
                String[] line = reader.readLine();
                if (line == null) break;
                processLine(line);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        buildSchemaTypes();
        reset();
    }

    private void buildSchemaTypes() {
        Map<String, List<CsvFieldInfo>> fieldsByClass = indexToField.values().stream().collect(Collectors.groupingBy(csvFieldInfo -> csvFieldInfo.className));
        buildAndAddTypes(fieldsByClass);
        addContentTypes();
    }

    private void buildAndAddTypes(Map<String, List<CsvFieldInfo>> fieldsByClass) {
        for (Map.Entry<String, List<CsvFieldInfo>> entry : fieldsByClass.entrySet()) {
            String className = entry.getKey();
            TypeDef type = new TypeDef(className, className, getFields(entry.getValue()));
            addType(type, className);
        }
    }

    private FieldDef[] getFields(List<CsvFieldInfo> fieldsInfo) {
        return fieldsInfo.stream().map(CsvFieldInfo::getField).toArray(FieldDef[]::new);
    }

    private void processHeaders(String[] headers) {
        indexToField = new HashMap<>(headers.length);
        headersLength = headers.length;
        for (int i = 0; i < headers.length; i++) {
            String[] split = headers[i].split("\\.");
            if (split.length == 2) {
                String className = split[0];
                String fieldName = split[1];
                CsvFieldInfo field = new CsvFieldInfo(fieldName, className);
                indexToField.put(i, field);
            } else {
                if (headers[i].equals("keyword")) {
                    keywordIndex = i;
                } else if (isCommonsColumn(headers[i])) {
                    //skip
                } else {
                    CsvFieldInfo field = new CsvFieldInfo(headers[i], "DefaultClass");
                    indexToField.put(i, field);
                }
            }
        }
    }

    private void processLine(String[] values) {
        if (values.length != headersLength) {
            //The message does not match the header
            return;
        }
        for (Map.Entry<Integer, CsvFieldInfo> entry : indexToField.entrySet()) {
            entry.getValue().process(values[entry.getKey()]);
        }
        buildHierarchy(values);
    }

    private String getContentClassName(String[] values) {
        if (keywordIndex == -1) {
            return getLastNonNullClassName(values);
        }
        return values[keywordIndex];
    }

    private void reset() {
        keywordIndex = -1;
        headersLength = -1;
        hierarchy.clear();
        indexToField.clear();
    }

    public SchemaDef getSchema() {
        if (types.size() == 0) {
            throw new IllegalArgumentException("Generated schema does not have content classes");
        }
        SchemaDef schema = new SchemaDef();
        schema.all = all.values().toArray(new TypeDef[0]);
        schema.types = types.toArray(new TypeDef[0]);
        return schema;
    }

    private void addContentTypes() {
        for (Map.Entry<String, Set<Integer>> entry : hierarchy.entrySet()) {
            String className = entry.getKey();
            Set<Integer> indexes = entry.getValue();
            List<String> hierarchyClassNames = new LinkedList<>();
            for (Integer index : indexes) {
                String name = indexToField.get(index).className;
                if (!hierarchyClassNames.contains(name))
                    hierarchyClassNames.add(name);
            }
            for (int i = hierarchyClassNames.size() - 1; i > 0; i--) {
                TypeDef typeDef = all.get(hierarchyClassNames.get(i));
                typeDef.setParent(all.get(hierarchyClassNames.get(i - 1)).getName());
            }
            types.add(all.get(className));
        }
    }

    private void buildHierarchy(String[] values) {
        String contentClassName = getContentClassName(values);
        if (contentClassName == null)
            //The message does not have valuable information
            return;
        if (!hierarchy.containsKey(contentClassName)) {
            hierarchy.put(contentClassName, new TreeSet<>());
        }
        Set<Integer> fieldsIndexInHierarchy = hierarchy.get(contentClassName);
        for (Integer index : indexToField.keySet()) {
            if (!TextUtils.isEmpty(values[index])) {
                fieldsIndexInHierarchy.add(index);
            }
        }
    }

    private String getLastNonNullClassName(String[] objectLine) {
        for (int i = objectLine.length - 1; i >= 0; i--) {
            if (objectLine[i] != null && !objectLine[i].isEmpty()) {
                CsvFieldInfo csvFieldInfo = indexToField.get(i);
                if (csvFieldInfo != null) {
                    return csvFieldInfo.className;
                }
            }
        }
        return null;
    }

    private void addType(TypeDef type, String simpleName) {
        if (all.containsKey(simpleName)) {
            all.put(simpleName, mergeTypes(type, all.get(simpleName)));
        } else {
            all.put(simpleName, type);
        }
    }

    private TypeDef mergeTypes(TypeDef newType, TypeDef oldType) {
        //at this stage the new type cannot have a parent
        newType.setParent(oldType.getParent());
        return merger.mergeTypes(newType, oldType);
    }

    private static boolean isCommonsColumn(String headers) {
        return headers.equals(DEFAULT_TIMESTAMP_COLUMN_NAME) || headers.equals(DEFAULT_DATETIME_COLUMN_NAME) ||
                headers.equals("symbol");
    }

    private boolean isBinaryDataType(String value) {
        if (value.startsWith("[") && !value.contains("\"")) {
            try {
                jsonFormatter.fromJson(value, byte[].class);
                return true;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    private boolean isPossibleDataType(Integer dataTypeCode, String value) {
        switch (dataTypeCode) {
            case T_DATE_TIME_TYPE:
                try {
                    dateFormatter.fromDateString(value);
                    return true;
                } catch (DateTimeParseException e) {
                    //try ns
                }
                try {
                    nsDateFormatter.fromNanoDateString(value);
                    return true;
                } catch (DateTimeParseException e) {
                }
                return false;
            case T_INTEGER_TYPE:
                try {
                    Long.parseLong(value);
                } catch (Exception e) {
                    return false;
                }
                break;
            case T_BINARY_TYPE:
                return isBinaryDataType(value);
            case T_TIME_OF_DAY_TYPE:
                if (!value.contains(":") || value.startsWith("{") || value.startsWith("[")) {
                    return false;
                }
            default:
                try {
                    dataTypesForParsing.get(dataTypeCode).parse(value);
                } catch (Exception e) {
                    return false;
                }
                break;
        }
        return true;
    }


    private class CsvFieldInfo {

        final String name;
        final String className;
        boolean nullable = false;
        private boolean isEnum;
        private boolean isStatic;
        private String staticValue;
        private boolean isObject = true;
        private Map<String, Map<String, CsvFieldInfo>> objectFieldsInfo = new HashMap<>();
        private boolean isArray = true;
        private CsvFieldInfo arrayFieldInfo;
        Set<Integer> possibleDataTypes = new HashSet<>();
        Set<String> enumValues = new HashSet<>();
        private int nullValuesCount;
        private int totalValuesCount;

        public CsvFieldInfo(String name, String className) {
            this.name = name;
            this.className = className;
            possibleDataTypes.addAll(TYPES.keySet());
            isEnum = enumCheck;
            isStatic = staticCheck;
        }

        void process(String value) {
            totalValuesCount++;
            if (TextUtils.isEmpty(value)) {
                nullValuesCount++;
                nullable = true;
                isStatic = false;
            } else {
                if (isStatic) {
                    if (staticValue == null) {
                        staticValue = value;
                    } else {
                        isStatic = staticValue.equals(value);
                    }
                }
                if (isEnum) {
                    isEnumValue(value);
                }
                if (isObject) {
                    isObjectValue(value);
                }
                if (isArray) {
                    isArrayValue(value);
                }
                possibleDataTypes.removeIf(dataTypeCode -> !isPossibleDataType(dataTypeCode, value));
            }
        }

        private void isArrayValue(String value) {
            if (value.startsWith("[")) {
                try {
                    List<String> innerValues = jsonFormatter.fromJson(value, List.class);
                    for (String arrValue : innerValues) {
                        if (arrayFieldInfo == null) {
                            arrayFieldInfo = new CsvFieldInfo("inner", className);
                        }
                        arrayFieldInfo.process(arrValue);
                    }
                } catch (Exception e) {
                    isArray = false;
                    arrayFieldInfo = null;
                }
            } else {
                isArray = false;
                arrayFieldInfo = null;
            }
        }

        private void isObjectValue(String value) {
            if (value.startsWith("{")) {
                try {
                    Map<String, String> object = jsonFormatter.fromJson(value, Map.class);
                    String className = object.get(OBJECT_CLASS_NAME);
                    if (!objectFieldsInfo.containsKey(className)) {
                        objectFieldsInfo.put(className, new HashMap<>());
                    }
                    Map<String, CsvFieldInfo> fieldsInfoMap = objectFieldsInfo.get(className);
                    for (Map.Entry<String, String> entry : object.entrySet()) {
                        if (OBJECT_CLASS_NAME.equals(entry.getKey()))
                            continue;
                        if (!fieldsInfoMap.containsKey(entry.getKey())) {
                            fieldsInfoMap.put(entry.getKey(), new CsvFieldInfo(entry.getKey(), className));
                        }
                        fieldsInfoMap.get(entry.getKey()).process(entry.getValue());
                    }
                } catch (Exception e) {
                    isObject = false;
                    objectFieldsInfo = null;
                }
            } else {
                isObject = false;
                objectFieldsInfo = null;
            }
        }

        private void isEnumValue(String value) {
            if (enumValues.size() < enumValuesCount && Pattern.matches(ENUM_REGEX, value)) {
                enumValues.add(value);
            } else {
                isEnum = false;
            }
        }

        public FieldDef getField() {
            FieldDef field = new FieldDef();
            field.setName(name);
            DataTypeDef dataType;
            if (nullValuesCount == totalValuesCount) {
                dataType = new DataTypeDef(VARCHAR_DT_NAME, VarcharDataType.ENCODING_INLINE_VARSIZE, nullable);
            } else if (isObject) {
                List<TypeDef> innerTypes = addAndGetInnerTypes();
                dataType = new DataTypeDef("OBJECT", null, nullable);
                dataType.setTypes(innerTypes.stream().map(TypeDef::getName).collect(Collectors.toList()));
            } else if (isArray) {
                if (possibleDataTypes.contains(T_BINARY_TYPE)) {
                    dataType = new DataTypeDef("BINARY", null, nullable);
                } else {
                    dataType = new DataTypeDef("ARRAY", null, nullable);
                    DataTypeDef elementType = arrayFieldInfo.getField().getType();
                    dataType.setElementType(elementType);
                }
            } else if (possibleDataTypes.size() > 0) {
                Integer dataTypeCode = possibleDataTypes.stream().findFirst().orElseThrow(RuntimeException::new);
                if (removeNsEncoding && dataTypeCode == T_DATE_TIME_TYPE) {
                    dataType = new DataTypeDef(TYPES.get(dataTypeCode), null, nullable);
                } else {
                    dataType = new DataTypeDef(TYPES.get(dataTypeCode), ENCODINGS.get(dataTypeCode), nullable);
                }
            } else if (isEnumDataType()) {
                TypeDef enumType = addEnumType();
                dataType = new DataTypeDef(enumType.getName(), null, nullable);
            } else {
                dataType = new DataTypeDef(VARCHAR_DT_NAME, VarcharDataType.ENCODING_INLINE_VARSIZE, nullable);
            }
            field.setType(dataType);
            if (isStatic) {
                field.setStatic(true);
                field.setValue(staticValue);
            }
            return field;
        }

        private TypeDef addEnumType() {
            FieldDef[] fields = new FieldDef[enumValues.size()];
            int i = 0;
            for (String enumValue : new TreeSet<>(enumValues)) {
                fields[i++] = FieldDef.createNonStatic(enumValue, enumValue, enumValue, new DataTypeDef("ENUM", null, false), null, false);
            }
            TypeDef enumType = new TypeDef("enum", null, fields);
            enumType.setEnum(true);
            if (!enums.containsKey(enumType)) {
                String typeName = "ENUM_TYPE_" + ++enumTypeCount;
                enums.put(enumType, typeName);
                TypeDef type = new TypeDef(typeName, typeName, fields);
                type.setEnum(true);
                addType(type, typeName);
                return type;
            } else {
                return all.get(enums.get(enumType));
            }
        }

        private boolean isEnumDataType() {
            if (isEnum) {
                int notNullableValues = totalValuesCount - nullValuesCount;
                double enumRepetitionRate = (1.0 * notNullableValues) / enumValues.size();
                if (enumRepetitionRate > CsvSchemaParser.this.enumRepeatRate) {
                    return true;
                }
            }
            return false;
        }

        private List<TypeDef> addAndGetInnerTypes() {
            List<TypeDef> innerTypes = new ArrayList<>(objectFieldsInfo.size());
            for (String typeName : objectFieldsInfo.keySet()) {
                Map<String, CsvFieldInfo> fieldsMap = objectFieldsInfo.get(typeName);
                TypeDef type = new TypeDef(typeName, typeName, getFields(new ArrayList<>(fieldsMap.values())));
                innerTypes.add(type);
                addType(type, getSimpleName(typeName));
            }
            return innerTypes;
        }
    }
}

class MapJsonDeserializer implements JsonDeserializer<Map> {
    private final Gson gson = new Gson();

    @Override
    public Map deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) {
        return deserialize(json, typeOfT);
    }

    private Map deserialize(JsonElement json, Type typeOfT) {

        if (json.isJsonObject()) {
            JsonObject jsonObject = json.getAsJsonObject();
            Map<String, String> result = new LinkedHashMap<>(jsonObject.size());
            for (String key : jsonObject.keySet()) {
                JsonElement element = jsonObject.get(key);
                String value = null;
                if (element.isJsonPrimitive()) {
                    value = element.getAsString();
                } else if (element.isJsonObject() || element.isJsonArray()) {
                    value = element.toString();
                }
                result.put(key, value);
            }
            return result;
        } else {
            return gson.fromJson(json, typeOfT);
        }
    }
}

class ListJsonDeserializer implements JsonDeserializer<List> {
    private final Gson gson = new Gson();

    @Override
    public List deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) {
        return deserialize(json, typeOfT);
    }

    private List deserialize(JsonElement json, Type typeOfT) {

        if (json.isJsonArray()) {
            JsonArray jsonArray = json.getAsJsonArray();
            ArrayList<String> result = new ArrayList<>(jsonArray.size());
            for (JsonElement element : jsonArray) {
                String value = null;
                if (element.isJsonPrimitive()) {
                    value = element.getAsString();
                } else if (element.isJsonObject() || element.isJsonArray()) {
                    value = element.toString();
                }
                result.add(value);
            }
            return result;
        } else {
            return gson.fromJson(json, typeOfT);
        }
    }
}