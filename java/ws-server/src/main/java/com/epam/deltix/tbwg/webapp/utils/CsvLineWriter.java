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

package com.epam.deltix.tbwg.webapp.utils;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.NullValueException;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.ReadableValue;
import com.epam.deltix.qsrv.hf.pub.codec.*;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.tbwg.webapp.model.input.ExportMode;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.tbwg.webapp.model.input.TypeSelection;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.io.CSVWriter;
import com.epam.deltix.util.memory.MemoryDataInput;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static com.epam.deltix.qsrv.hf.pub.RawMessageManipulator.OBJECT_CLASS_NAME;

public class CsvLineWriter {

    private static final Log LOGGER = LogFactory.getLog(CsvLineWriter.class);

    private static class ColumnInfo {
        private final String type;
        private final String name;
        private final int position;
        private final DataField field;

        public ColumnInfo(String type, String name, int position, DataField field) {
            this.type = type;
            this.name = name;
            this.position = position;
            this.field = field;
        }
    }

    private final CSVWriter writer;
    private final LinkedHashMap<String, ColumnInfo> columns = new LinkedHashMap<>();
    private final Object[] values;

    private final MemoryDataInput buffer = new MemoryDataInput();
    private final ObjectToObjectHashMap<String, UnboundDecoder> decoders = new ObjectToObjectHashMap<>();
    private final Map<String, Map<String, String>> staticValuesMap = new HashMap<>();

    public final CodecMetaFactory codecFactory = InterpretingCodecMetaFactory.INSTANCE;

    private final DateFormatter dateFormatter;
    private final Gson jsonFormatter =  new GsonBuilder().disableHtmlEscaping().create();

    private final boolean enableStaticFields;
    private final boolean polymorphic;
    private final boolean filePerSymbol;

    public CsvLineWriter(CSVWriter writer, ExportRequest request, RecordClassDescriptor[] descriptors) {
        this.writer = writer;
        this.filePerSymbol = request.mode == ExportMode.FILE_PER_SYMBOL;
        this.polymorphic = descriptors.length > 1;
        this.dateFormatter = new DateFormatter(request.datetimeFormat);
        this.enableStaticFields = request.enableStaticFields;

        if (request.types != null) {
            for (TypeSelection type : request.types) {
                RecordClassDescriptor descriptor = findDescriptor(descriptors, type.name);
                if (descriptor == null) {
                    LOGGER.warn().append("Type ").append(type.name).append(" not found in descriptors.").commit();
                } else {
                    collectColumns(descriptor,
                        Arrays.stream(type.fields).map(String::toUpperCase)
                            .collect(Collectors.toSet())
                    );
                }
            }
        } else {
            for (RecordClassDescriptor descriptor : descriptors) {
                collectColumns(descriptor, null);
            }
        }

        values = new Object[columns.size()];
    }

    public void flush() throws IOException {
        writer.flush();
    }

    private RecordClassDescriptor findDescriptor(RecordClassDescriptor[] descriptors, String type) {
        for (RecordClassDescriptor descriptor : descriptors) {
            if (type.equalsIgnoreCase(descriptor.getName())) {
                return descriptor;
            }
        }

        return null;
    }

    private void collectColumns(RecordClassDescriptor descriptor, Set<String> fields) {
        RecordClassDescriptor parentDescriptor = descriptor.getParent();
        if (parentDescriptor != null) {
            collectColumns(parentDescriptor, fields);
        }

        for (DataField field : descriptor.getFields()) {
            if (!isAllowed(field.getName(), fields)) {
                continue;
            }

            String id = columnId(descriptor.getName(), field.getName());
            if (!columns.containsKey(id)) {
                ColumnInfo column = new ColumnInfo(descriptor.getName(), field.getName(), columns.size(), field);
                columns.put(id, column);
            }
        }
    }

    private boolean isAllowed(String fieldName, Set<String> fields) {
        return fields == null || fields.contains(fieldName.toUpperCase());
    }

    public void writeHeader() throws IOException {
        if (polymorphic) {
            writer.writeCell("keyword");
            writer.writeSeparator();
        }
        if (!filePerSymbol) {
            writer.writeCell("symbol");
            writer.writeSeparator();
        }
        writer.writeCell("timestamp");

        for (ColumnInfo column : columns.values()) {
            writer.writeSeparator();
            writer.writeCell(getShortClassName(column.type) + "." + column.name);
        }

        writer.writeLine();
    }

    public void writeLine(final RawMessage msg) throws IOException {
        if (polymorphic) {
            writer.writeCell(getShortClassName(msg.type.getName()));
            writer.writeSeparator();
        }
        if (!filePerSymbol) {
            writer.writeCell(msg.getSymbol());
            writer.writeSeparator();
        }
        writer.writeCell(formatTimestamp(msg.getTimeStampMs()));
        writer.writeSeparator();

        Arrays.fill(values, null);

        buffer.setBytes(msg.data, msg.offset, msg.length);
        UnboundDecoder decoder = getDecoder(msg.type);
        decoder.beginRead(buffer);
        while (decoder.nextField()) {
            NonStaticFieldInfo fieldInfo = decoder.getField();
            ColumnInfo column = columns.get(columnId(fieldInfo.getOwner().getName(), fieldInfo.getName()));
            if (column != null) {
                if (!decoder.isNull()) {
                    values[column.position] = formatValue(column.field.getType(), decoder);
                }
            }
        }
        if (enableStaticFields) {
            Map<String, String> staticValues = getStaticValues(msg.type);
            for (Map.Entry<String, String> entry : staticValues.entrySet()) {
                ColumnInfo column = columns.get(entry.getKey());
                if (column != null) {
                    values[column.position] = entry.getValue();
                }
            }
        }
        writer.writeLine(values);
    }

    private String formatValue(DataType type, ReadableValue decoder) {
        Object value = formatValueToObject(type, decoder);
        if (value instanceof Map || value instanceof List){
            return jsonFormatter.toJson(value);
        }
        return (String) value;
    }

        private Object formatValueToObject(DataType type, ReadableValue decoder) {
        try {
            if (type instanceof DateTimeDataType) {
                return formatTimestamp(decoder.getLong());
            } else if (type instanceof ClassDataType) {
                return formatObjectValues(decoder);
            } else if (type instanceof ArrayDataType) {
                return formatArrayValue((ArrayDataType) type, decoder);
            } else if (type instanceof BinaryDataType) {
                final int size = decoder.getBinaryLength();
                final byte[] bin = new byte[size];
                decoder.getBinary(0, size, bin, 0);
                return Arrays.toString(bin);
            }
            return decoder.getString();
        } catch (NullValueException e) {
            return null;
        }
    }

    private List<Object> formatArrayValue(ArrayDataType type, ReadableValue decoder) {
        final int len = decoder.getArrayLength();
        final DataType elementDataType = type.getElementDataType();
        List<Object> list = new ArrayList<>(len);
        for (int i = 0; i < len; i++) {
            final ReadableValue rv = decoder.nextReadableElement();
            list.add( formatValueToObject(elementDataType, rv));
        }
        return list;
    }

    private Map<String, Object> formatObjectValues(ReadableValue decoder) {
        final UnboundDecoder fieldDecoder = decoder.getFieldDecoder();
        Map<String, Object> valuesMap = new LinkedHashMap<>();
        RecordClassDescriptor descriptor = fieldDecoder.getClassInfo().getDescriptor();
        if (fieldDecoder.getClassInfo() != null) {
            valuesMap.put(OBJECT_CLASS_NAME, descriptor.getName());
        }
        while (fieldDecoder.nextField()) {
            NonStaticFieldInfo field = fieldDecoder.getField();
            Object value = formatValueToObject(field.getType(), fieldDecoder);
            valuesMap.put(field.getName(), value);
        }
        if (enableStaticFields) {
            Map<String, String> staticValues = getStaticValues(descriptor);
            for (DataField field : descriptor.getFields()) {
                if (field instanceof StaticDataField) {
                    String value = staticValues.get(columnId(descriptor.getName(), field.getName()));
                    valuesMap.put(field.getName(), value);
                }
            }
        }
        return valuesMap;
    }

    private String formatTimestamp(long timestamp) {
        return dateFormatter.toDateString(timestamp);
    }

    private String columnId(String type, String name) {
        return (type + "." + name).toUpperCase();
    }

    private String getShortClassName(String type) {
        int index = type.lastIndexOf('.');
        return index >= 0 ? type.substring(index + 1) : type;
    }

    private UnboundDecoder getDecoder(RecordClassDescriptor type) {
        String name = type.getName();
        UnboundDecoder decoder = decoders.get(name, null);

        if (decoder == null) {
            decoder = codecFactory.createFixedUnboundDecoderFactory(type).create();
            decoders.put(name, decoder);
        }
        return decoder;
    }

    private Map<String, String> getStaticValues(RecordClassDescriptor type) {
        String name = type.getName();
        Map<String, String> staticValues = staticValuesMap.get(name);
        if (staticValues == null) {
            staticValues = collectStaticValues(type);
            staticValuesMap.put(name, staticValues);
        }
        return staticValues;
    }

    private Map<String, String> collectStaticValues(RecordClassDescriptor type) {
        Map<String, String> staticValues = new HashMap<>();
        for (DataField field : type.getFields()) {
            if (field instanceof StaticDataField) {
                StaticDataField staticField = (StaticDataField) field;
                staticValues.put(columnId(type.getName(), staticField.getName()), staticField.getStaticValue());
            }
        }
        return staticValues;
    }
}

