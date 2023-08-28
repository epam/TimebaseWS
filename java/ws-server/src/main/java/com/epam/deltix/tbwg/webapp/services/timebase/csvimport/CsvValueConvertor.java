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

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.ToNumberPolicy;
import com.epam.deltix.qsrv.hf.pub.RawMessageManipulator;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.RawMessageHelper;
import com.epam.deltix.tbwg.webapp.model.input.StreamFieldInfo;
import com.epam.deltix.tbwg.webapp.model.input.ValidateResponse;
import com.epam.deltix.tbwg.webapp.model.input.ValidateStatus;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.IllegalTypeException;
import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static com.epam.deltix.qsrv.hf.pub.md.DataType.*;
import static com.epam.deltix.tbwg.webapp.utils.CsvImportUtil.messageTypeHasField;

public class CsvValueConvertor {

    private final CsvImportGeneralSettings generalSettings;
    private final SimpleDateFormat dateFormat;
    private final RecordClassDescriptor[] descriptors;
    private final Gson jsonFormatter = new GsonBuilder()
            .setObjectToNumberStrategy(ToNumberPolicy.LONG_OR_DOUBLE)
            .create();

    public CsvValueConvertor(RecordClassDescriptor[] descriptors, CsvImportGeneralSettings generalSettings) {
        this.descriptors = descriptors;
        this.generalSettings = generalSettings;
        dateFormat = new SimpleDateFormat(generalSettings.getDataTimeFormat());
        dateFormat.setTimeZone(TimeZone.getTimeZone(generalSettings.getTimeZone()));

    }

    public ValidateResponse isConvertibleValue(StreamFieldInfo fieldInfo, String[] line,
                                               int position, int typeMappingColumnIndex) {
        String value = line[position];
        try {
            RecordClassDescriptor messageType = findMessageType(line, typeMappingColumnIndex);
            if (messageTypeHasField(messageType, fieldInfo) || CommonFields.isCommonField(fieldInfo)) {
                return tryConvertValue(fieldInfo, value, messageType);
            } else {
                String message = String.format("Field %s not used in %s message type",
                        fieldInfo.getName(), messageType.getName());
                return new ValidateResponse(ValidateStatus.VALID, message);
            }
        } catch (Exception e) {
            String message = String.format("Cannot convert value %s to type %s. Reason: %s",
                    value, fieldInfo.getFieldType().getName(), e.getMessage());
            return new ValidateResponse(ValidateStatus.NON_VALID, message);
        }
    }

    private RecordClassDescriptor findMessageType(String[] line, int typeMappingColumnIndex) throws IllegalTypeException {
        if (typeMappingColumnIndex == -1) {
            return getDefaultMessageType();
        } else {
            return (RecordClassDescriptor) convertMessageType(line[typeMappingColumnIndex]);
        }
    }

    public ValidateResponse tryConvertValue(StreamFieldInfo fieldInfo, String value, RecordClassDescriptor descriptor) {
        if (value == null) {
            if (fieldInfo.getFieldType().isNullable()) {
                return new ValidateResponse(ValidateStatus.VALID);
            } else {
                return new ValidateResponse(ValidateStatus.NON_VALID,
                        "Cannot set null value in non-nullable field");
            }
        }
        if (CommonFields.isCommonField(fieldInfo)) {
            try {
                convertCommonFieldsValue(fieldInfo, value);
            } catch (Exception e) {
                return new ValidateResponse(ValidateStatus.NON_VALID, e.getMessage());
            }
            return new ValidateResponse(ValidateStatus.VALID);
        }
        DataType dataType = getDataType(fieldInfo, descriptor);
        if (dataType == null) {
            return new ValidateResponse(ValidateStatus.VALID, "Not used in this message type");
        }
        return tryConvertStandardDataType(fieldInfo.getFormat(), value, dataType);
    }

    private ValidateResponse tryConvertStandardDataType(String format, String value, DataType dataType) {
        try {
            switch (dataType.getCode()) {
                case T_DATE_TIME_TYPE:
                case T_ARRAY_TYPE:
                case T_OBJECT_TYPE:
                case T_BINARY_TYPE:
                    convertStandardDataType(format, value, dataType);
                    break;
                default:
                    dataType.parse(value);
                    break;
            }
        } catch (Exception e) {
            String message = String.format("Cannot convert value %s to type %s. Reason: %s",
                    value, dataType.getBaseName(), e.getMessage());
            if (dataType.isNullable()) {
                if (generalSettings.getNullValues().contains(value)) {
                    return new ValidateResponse(ValidateStatus.VALID);
                }
                return new ValidateResponse(ValidateStatus.CAN_SKIP, message);
            } else {
                return new ValidateResponse(ValidateStatus.NON_VALID, message);
            }
        }
        return new ValidateResponse(ValidateStatus.VALID);
    }


    // if throws ParseException or RuntimeException convert skip, IllegalTypeException skip- or Abort
    // if value not convert and field is Nullable -> return null
    public Object convertValue(StreamFieldInfo fieldInfo, String value,
                               RecordClassDescriptor descriptor) throws IllegalTypeException {
        if (value == null) {
            if (fieldInfo.getFieldType().isNullable()) {
                return null;
            } else {
                throw new RuntimeException("Can't set null on non-null field " + fieldInfo.getTitle());
            }
        }
        if (CommonFields.isCommonField(fieldInfo)) {
            return convertCommonFieldsValue(fieldInfo, value);
        }
        DataType dataType = getDataType(fieldInfo, descriptor);
        if (dataType != null) {
            return convertStandardDataType(fieldInfo.getFormat(), value, dataType);
        }
        throw new IllegalArgumentException("Field \"" + fieldInfo.getName() + "\" not found in message type: " +
                descriptor.getName());
    }

    private Object convertStandardDataType(String format, String value, DataType dataType) {
        if (dataType.isNullable() && generalSettings.getNullValues().contains(value)) {
            return null;
        }
        try {
            switch (dataType.getCode()) {
                case T_DATE_TIME_TYPE:
                    return convertTimestampValue(format, value);
                case T_BOOLEAN_TYPE:
                case T_CHAR_TYPE:
                case T_TIME_OF_DAY_TYPE:
                    return dataType.parse(value);
                case T_ARRAY_TYPE:
                    return convertArrayValue((ArrayDataType) dataType, value);
                case T_OBJECT_TYPE:
                    return convertObjectValue((ClassDataType) dataType, value);
                case T_BINARY_TYPE:
                    return convertByteArray(value);
                default:
                    return RawMessageHelper.parseValue(dataType, value);
            }
        } catch (IllegalArgumentException | ParseException e) {
            if (dataType.isNullable()) return null;
            throw new IllegalArgumentException(e);
        }
    }

    private Object convertByteArray(String value) {
        return jsonFormatter.fromJson(value, byte[].class);
    }

    private Object convertObjectValue(ClassDataType dataType, String value) {
        Map map = jsonFormatter.fromJson(value, Map.class);
        return castObjectValue(map, dataType);
    }

    private Object convertArrayValue(ArrayDataType dataType, String value) throws ParseException {
        List list = jsonFormatter.fromJson(value, List.class);
        return castObjectValue(list, dataType);
    }

    private Object convertTimestampValue(String format, String value) throws ParseException {
        if (format == null) format = generalSettings.getDataTimeFormat();
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat(format);
        simpleDateFormat.setTimeZone(TimeZone.getTimeZone(generalSettings.getTimeZone()));
        return simpleDateFormat.parse(value).getTime();
    }

    private DataType getDataType(StreamFieldInfo fieldInfo, RecordClassDescriptor descriptor) {
        DataField field = descriptor.getField(fieldInfo.getName());
        return field != null ? field.getType() : null;
    }

    private Object convertCommonFieldsValue(StreamFieldInfo fieldInfo, String value)
            throws IllegalTypeException {
        CommonFields commonFields = CommonFields.valueOfFieldInfo(fieldInfo);
        switch (commonFields) {
//            case INSTRUMENT_TYPE:
//                return convertInstrumentType(value);
            case TIMESTAMP:
                return convertTimestampMs(value);
            case KEYWORD:
                return convertMessageType(value);
            case SYMBOL:
                return convertSymbol(value);
            default:
                throw new IllegalArgumentException("Field \"" + fieldInfo.getTitle() + "\" not found");
        }
    }

    private Object convertSymbol(String value) {
        if (generalSettings.getSymbols() != null) {
            if (Arrays.asList(generalSettings.getSymbols()).contains(value)) {
                return value;
            } else {
                throw new IllegalArgumentException("The value \"" + value + "\" is not in the list of valid symbols");
            }
        } else {
            return value;
        }
    }

    public Object convertMessageType(String typeName) throws IllegalTypeException {
        Map<String, String> typeToKeywordMapping = generalSettings.getTypeToKeywordMapping();
        if (typeToKeywordMapping != null && typeToKeywordMapping.size() == 1) {
            return getDefaultMessageType();
        } else if (typeToKeywordMapping != null && typeToKeywordMapping.size() > 1) {
            if (typeToKeywordMapping.containsValue(typeName)) {
                for (RecordClassDescriptor descriptor : descriptors) {
                    if (descriptor.getName().equals(getKey(typeName, typeToKeywordMapping))) {
                        return descriptor;
                    }
                }
            }
        }
        throw new IllegalTypeException("Undefined message type for the " + typeName);
    }

    private RecordClassDescriptor getDefaultMessageType() throws IllegalTypeException {
        return CsvImportUtil.getDefaultMessageType(descriptors, generalSettings.getTypeToKeywordMapping());
    }

    private String getKey(String typeName, Map<String, String> typeToKeywordMapping) {
        return typeToKeywordMapping
                .entrySet()
                .stream()
                .filter(entry -> typeName.equals(entry.getValue()))
                .map(Map.Entry::getKey)
                .findFirst()
                .get();
    }

//    private Object convertInstrumentType(String instrumentType) {
//        try {
//            return InstrumentType.valueOf(instrumentType);
//        } catch (Exception e) {
//            throw new IllegalArgumentException("Enumeration 'InstrumentType' does not have value to '" + instrumentType + "'.");
//        }
//    }

    private long convertTimestampMs(String value) {
        try {
            long time = dateFormat.parse(value).getTime();
            if (time < 0) {
                throw new RuntimeException();
            }
            return time;
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot parse timestamp value '" + value +
                    "' to '" + generalSettings.getDataTimeFormat() + "' format.");
        }
    }

    private Object castObjectValue(Object value, DataType type) {
        if (value == null)
            return null;
        if (value instanceof String) {
            return convertStandardDataType(null, (String) value, type);
        } else if (type instanceof IntegerDataType)
            switch (((IntegerDataType) type).getSize()) {
                case 1:
                    return ((Number) value).byteValue();
                case 2:
                    return ((Number) value).shortValue();
                case 4:
                case IntegerDataType.PACKED_UNSIGNED_INT:
                case IntegerDataType.PACKED_INTERVAL:
                    return ((Number) value).intValue();
                default:
                    return ((Number) value).longValue();
            }
        else if (type instanceof FloatDataType) {
            if (type.getEncoding().equals(FloatDataType.ENCODING_FIXED_FLOAT))
                return ((Number) value).floatValue();
            else
                return ((Number) value).doubleValue();
        } else if (type instanceof BooleanDataType && value instanceof Number) {
            byte byteValue = ((Number) value).byteValue();
            if (byteValue == -1) return null;
            return byteValue;
        } else if (type instanceof DateTimeDataType) {
            if (value instanceof Number) {
                return ((Number) value).longValue();
            }
        } else if (type instanceof TimeOfDayDataType)
            return ((Number) value).intValue();
        else if (type instanceof ArrayDataType) {
            Object[] objects = value instanceof List ? ((List) value).toArray() : (Object[]) value;
            return castArrayValues(objects, (ArrayDataType) type);
        } else if (type instanceof ClassDataType) {
            return castObjectValues((Map) value, (ClassDataType) type);
        } else if (type instanceof BinaryDataType) {
            return castBinaryValues((List) value);
        }
        return value;
    }

    private Object castBinaryValues(List value) {
        byte[] result = new byte[value.size()];
        for (int i = 0; i < value.size(); i++) {
            Number o = (Number) value.get(i);
            result[i] = o.byteValue();
        }
        return result;
    }

    private Object castObjectValues(Map value, ClassDataType type) {
        RecordClassDescriptor[] classDescriptors = type.getDescriptors();
        RecordClassDescriptor descriptor = classDescriptors[0];
        if (value.containsKey(RawMessageManipulator.OBJECT_CLASS_NAME)) {
            descriptor = findDescriptor(value, classDescriptors);
            value.put(RawMessageManipulator.OBJECT_CLASS_NAME, descriptor);
        }
        List<DataField> dataFields = Arrays.stream(descriptor.getFields())
                .filter(dataField -> dataField instanceof NonStaticDataField)
                .collect(Collectors.toList());
        for (DataField dataField : dataFields) {
            if (value.containsKey(dataField.getName())) {
                DataType fieldType = dataField.getType();
                Object o = value.get(dataField.getName());
                value.put(dataField.getName(), castObjectValue(o, fieldType));
            }
        }
        return value;
    }

    private RecordClassDescriptor findDescriptor(Map value, RecordClassDescriptor[] classDescriptors) {
        Object descriptor = value.get(RawMessageManipulator.OBJECT_CLASS_NAME);
        if (descriptor instanceof RecordClassDescriptor) {
            return (RecordClassDescriptor) descriptor;
        } else if (descriptor instanceof String) {
            for (RecordClassDescriptor recordClassDescriptor : classDescriptors) {
                if (recordClassDescriptor.getName().equals(descriptor)) {
                    return recordClassDescriptor;
                }
            }
        } else if (descriptor instanceof Map) {
            if (((Map) descriptor).containsKey("name")) {
                Object name = ((Map) descriptor).get("name");
                for (RecordClassDescriptor recordClassDescriptor : classDescriptors) {
                    if (recordClassDescriptor.getName().equals(name)) {
                        return recordClassDescriptor;
                    }
                }
            }
        }
        return classDescriptors[0];
    }

    private Object[] castArrayValues(Object[] value, ArrayDataType type) {
        DataType elementDataType = type.getElementDataType();
        List list = new ArrayList();
        for (Object o : value) {
            list.add(castObjectValue(o, elementDataType));
        }
        return list.toArray();
    }
}
