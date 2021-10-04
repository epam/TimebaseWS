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
package com.epam.deltix.tbwg.services.grafana.qql;

import com.epam.deltix.streaming.MessageSource;
import com.epam.deltix.tbwg.services.grafana.exc.ValidationException;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.gflog.api.*;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.tbwg.services.grafana.exc.NoSuchStreamException;
import com.epam.deltix.tbwg.utils.qql.FilteredMessageSource;


import javax.annotation.Nonnull;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/20/2019
 */
public class SelectBuilder2 implements Reusable {

    private static final Log LOG = LogFactory.getLog(SelectBuilder2.class);

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")
            .withZone(ZoneOffset.UTC);
    private static final String SYMBOL = "symbol";
    private static final VarcharDataType SYMBOL_DT = new VarcharDataType(VarcharDataType.ENCODING_INLINE_VARSIZE, false, false);
    private static final String INSTRUMENT_TYPE = "type";
    //private static final EnumDataType INSTRUMENT_TYPE_DT = new EnumDataType(true, new EnumClassDescriptor(InstrumentType.class));
    private static final String TIMESTAMP = "timestamp";
    private static final DateTimeDataType TIMESTAMP_DT = new DateTimeDataType(false);

    private final List<String> options = new LinkedList<>();
    private final Map<String, Type> typesMap = new HashMap<>();
    private final Map<String, Type> shortTypesMap = new HashMap<>();
    private final Set<String> selectedFields = new HashSet<>();
    private final DXTickStream stream;
    private final DXTickDB db;
    private final InstrumentMessageType instrumentMessageType = new InstrumentMessageType();
    private final Map<String, Predicate<String>> runtimeFilters = new HashMap<>();
    private final Map<String, Set<String>> enumCache = new HashMap<>();

    private List<String> ids = null;
    private long startTime = Long.MIN_VALUE;

    private SelectBuilder2(DXTickDB db, DXTickStream stream) {
        this.stream = stream;
        this.db = db;
        prepareTypesAndFields();
    }

    private void prepareTypesAndFields() {
        for (RecordClassDescriptor type : stream.getTypes()) {
            addRcd(type);
        }
    }

    private void addRcd(RecordClassDescriptor rcd) {
        if (rcd != null && !typesMap.containsKey(rcd.getName())) {
            Map<String, Type.Field> map = new HashMap<>();
            Type type = new Type(rcd.getName(), map);
            for (DataField field : rcd.getFields()) {
                type.new Field(field.getName(), field.getType());
            }
            addRcd(rcd.getParent());
        }
    }

    public SelectBuilder2 selectAll() {
        selectedFields.clear();
        return this;
    }

    public SelectBuilder2 setIdentitiesList(List<String> ids) {
        this.ids = ids.isEmpty() ? null : ids;
        return this;
    }

    public SelectBuilder2 setIdentities(String... ids) {
        return setIdentitiesList(Arrays.asList(ids));
    }

    public SelectBuilder2 setSymbols(List<String> symbols) {
        return setIdentitiesList(symbols);
    }

    public SelectBuilder2 setSymbols(String... symbols) {
        return setIdentities(symbols);
    }

    public InstrumentMessageType instrumentMessage() {
        return instrumentMessageType;
    }

    public Type type(String type) throws NoSuchTypeException {
        return getType(type);
    }

    public Type type(Class<? extends InstrumentMessage> clazz) throws NoSuchTypeException {
        return type(clazz.getName());
    }

    private Type getType(String type) throws NoSuchTypeException {
        if (typesMap.containsKey(type)) {
            return typesMap.get(type);
        } else if (shortTypesMap.containsKey(type)) {
            return shortTypesMap.get(type);
        } else {
            throw new NoSuchTypeException(type);
        }
    }

    public SelectBuilder2 timeBetween(long startTime, long endTime) {
        try {
            return instrumentMessage().timestamp().between(Long.toString(startTime), Long.toString(endTime)).commitType();
        } catch (WrongTypeException exc) {
            LOG.error().append(exc).commit();
        }
        return this;
    }

    public SelectBuilder2 timeBetween(Instant startTime, Instant endTime) {
        return timeBetween(startTime.toEpochMilli(), endTime.toEpochMilli());
    }

    public SelectBuilder2 startTime(long startTime) {
        try {
            return instrumentMessage().timestamp().notLessThan(Long.toString(startTime)).commitType();
        } catch (WrongTypeException exc) {
            LOG.error().append(exc).commit();
        }
        return this;
    }

    public SelectBuilder2 startTime(Instant startTime) {
        try {
            return instrumentMessage().timestamp().notLessThan(startTime.toString()).commitType();
        } catch (WrongTypeException exc) {
            LOG.error().append(exc).commit();
        }
        return this;
    }

    public SelectBuilder2 endTime(long endTime) {
        try {
            return instrumentMessage().timestamp().notGreaterThan(Long.toString(endTime)).commitType();
        } catch (WrongTypeException exc) {
            LOG.error().append(exc).commit();
        }
        return this;
    }

    public SelectBuilder2 endTime(Instant endTime) {
        try {
            return instrumentMessage().timestamp().notGreaterThan(endTime.toString()).commitType();
        } catch (WrongTypeException exc) {
            LOG.error().append(exc).commit();
        }
        return this;
    }

    public MessageSource<InstrumentMessage> executeRaw() {
        if (db != null) {
            if (runtimeFilters.isEmpty()) {
                String query = toString();
                LOG.info().append("Executing query: ").append(query).commit();
                return db.executeQuery(
                        query,
                        new SelectionOptions(true, false),
                        null,
                        ids != null ? ids.toArray(new String[ids.size()]) : null,
                        startTime
                );
            } else {
                String query = toString();
                LOG.info().append("Executing query: ").append(query).commit();
                return new FilteredMessageSource(db.executeQuery(
                        query,
                        new SelectionOptions(true, false),
                        null,
                        ids != null ? ids.toArray(new String[ids.size()]) : null,
                        startTime
                ), runtimeFilters);
            }
        } else {
            throw new IllegalArgumentException("Timebase is undefined.");
        }
    }

    public static SelectBuilder2 builder(@Nonnull DXTickDB db, @Nonnull DXTickStream stream) {
        return new SelectBuilder2(db, stream);
    }

    public static SelectBuilder2 builder(@Nonnull DXTickDB db, @Nonnull String stream) throws NoSuchStreamException {
        DXTickStream str = db.getStream(stream);
        if (str == null) {
            throw new NoSuchStreamException(stream);
        } else {
            return new SelectBuilder2(db, str);
        }
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("select ");
        sb.append(selectedFields.isEmpty() ? "*" : String.join(",", selectedFields));
        sb.append(" from \"").append(stream.getKey()).append("\"");
        if (!options.isEmpty()) {
            sb.append(" where ").append(String.join(" and ", options));
        }
        return sb.toString();
    }

    @Override
    public void reuse() {

    }

    private static String dateTimeLiteral(String dateTime) {
        return "'" + dateTime + "'d";
    }

    private static String dateTimeLiteral(long longValue) {
        return dateTimeLiteral(DATE_TIME_FORMATTER.format(Instant.ofEpochMilli(longValue)));
    }

    private static String dateTimeLiteral(Instant instant) {
        return dateTimeLiteral(DATE_TIME_FORMATTER.format(instant));
    }

    public class Type {
        protected final String typeName;
        protected final Map<String, Field> fields;

        Type(String typeName, Map<String, Field> fields) {
            this.typeName = typeName;
            this.fields = fields;
            typesMap.put(typeName, this);
            shortTypesMap.put(shortType(typeName), this);
        }

        public Field field(String field) throws NoSuchFieldException {
            if (fields.containsKey(field)) {
                return fields.get(field);
            } else {
                throw new NoSuchFieldException(field);
            }
        }

        public Type selectFields(List<String> fieldsList) throws NoSuchFieldException {
            for (String field : fieldsList) {
                if (fields.containsKey(field)) {
                    fields.get(field).select();
                } else {
                    throw new NoSuchFieldException(field);
                }
            }
            return this;
        }

        public SelectBuilder2 commitType() {
            return SelectBuilder2.this;
        }

        public class Field {

            protected final String fieldName;
            protected final DataType dataType;

            Field(String fieldName, DataType dataType) {
                this.fieldName = fieldName;
                this.dataType = dataType;
                fields.put(fieldName, this);
            }

            public SelectBuilder2 commitType() {
                return SelectBuilder2.this;
            }

            public Type select() {
                selectedFields.add(getFullName());
                return Type.this;
            }

            public Type equalTo(String value) throws WrongTypeException {
                if (value.equalsIgnoreCase("null") || value.equalsIgnoreCase("NaN")) {
                    return isNull();
                } else if (value.equalsIgnoreCase("-infinity")) {
                    if (dataType instanceof FloatDataType) {
                        // ToDo
                        FloatDataType floatDataType = (FloatDataType) dataType;
                        if (floatDataType.isFloat()) {
                            return isNull();
                        } else if (floatDataType.isDecimal64()) {
                            return isNull();
                        } else {
                            return isNull();
                        }
                    } else {
                        throw new WrongTypeException(fieldName, value, dataType);
                    }
                } else if (value.equalsIgnoreCase("+infinity")) {
                    if (dataType instanceof FloatDataType) {
                        // ToDo
                        FloatDataType floatDataType = (FloatDataType) dataType;
                        if (floatDataType.isFloat()) {
                            return isNull();
                        } else if (floatDataType.isDecimal64()) {
                            return isNull();
                        } else {
                            return isNull();
                        }
                    } else {
                        throw new WrongTypeException(fieldName, value, dataType);
                    }
                } else {
                    return compare(value, "==");
                }
            }

            public Type equalTo(String... values) throws WrongTypeException {
                return set(true, values);
            }

            public Type equalTo(Collection<String> values) throws WrongTypeException {
                String[] array = values.toArray(new String[]{});
                if (array.length == 1) {
                    return equalTo(array[0]);
                } else {
                    return equalTo(array);
                }
            }

            public Type lessThan(String value) throws WrongTypeException {
                return compare(value, "<");
            }

            public Type notGreaterThan(String value) throws WrongTypeException {
                return compare(value, "<=");
            }

            public Type notLessThan(String value) throws WrongTypeException {
                return compare(value, ">=");
            }

            public Type greaterThan(String value) throws WrongTypeException {
                return compare(value, ">");
            }

            public Type notEqualTo(String value) throws WrongTypeException {
                if (value.equalsIgnoreCase("null")) {
                    return notNull();
                } else if (value.equalsIgnoreCase("-infinity") || value.equalsIgnoreCase("nan")) {
                    if (dataType instanceof FloatDataType) {
                        // ToDo
                        FloatDataType floatDataType = (FloatDataType) dataType;
                        if (floatDataType.isFloat()) {
                            return notNull();
                        } else if (floatDataType.isDecimal64()) {
                            return notNull();
                        } else {
                            return notNull();
                        }
                    } else {
                        throw new WrongTypeException(fieldName, value, dataType);
                    }
                } else if (value.equalsIgnoreCase("+infinity")) {
                    if (dataType instanceof FloatDataType) {
                        // ToDo
                        FloatDataType floatDataType = (FloatDataType) dataType;
                        if (floatDataType.isFloat()) {
                            return notNull();
                        } else if (floatDataType.isDecimal64()) {
                            return notNull();
                        } else {
                            return notNull();
                        }
                    } else {
                        throw new WrongTypeException(fieldName, value, dataType);
                    }
                } else {
                    return compare(value, "!=");
                }
            }

            public Type notEqualTo(String... values) throws WrongTypeException {
                return set(false, values);
            }

            public Type notEqualTo(Collection<String> values) throws WrongTypeException {
                String[] array = values.toArray(new String[]{});
                if (array.length == 1) {
                    return notEqualTo(array[0]);
                } else {
                    return notEqualTo(array);
                }
            }

            public Type notNull() throws WrongTypeException {
                return compare(null, "!=");
            }

            public Type isNull() throws WrongTypeException {
                return compare(null, "==");
            }

            public Type startsWith(String value) throws WrongTypeException {
                if (!(dataType instanceof VarcharDataType)) {
                    throw new WrongTypeException(getFullName(), value, dataType);
                }
                return like(value + "%");
            }

            public Type endsWith(String value) throws WrongTypeException {
                if (!(dataType instanceof VarcharDataType)) {
                    throw new WrongTypeException(getFullName(), value, dataType);
                }
                return like("%" + value);
            }

            public Type contains(String value) throws WrongTypeException {
                if (!(dataType instanceof VarcharDataType)) {
                    throw new WrongTypeException(getFullName(), value, dataType);
                }
                return like("%" + value + "%");
            }

            public Type notContains(String value) throws WrongTypeException {
                if (!(dataType instanceof VarcharDataType)) {
                    throw new WrongTypeException(getFullName(), value, dataType);
                }
                return notLike("%" + value + "%");
            }

            public Type between(String x, String y) throws WrongTypeException {
                options.add(String.format("%s between %s and %s", getFullName(), parseValue(dataType, x), parseValue(dataType, y)));
                return Type.this;
            }

            protected final void appendStringSet(List<Object> list, StringBuilder sb) {
                sb.append("(");
                for (int i = 0; i < list.size() - 1; i++) {
                    Object value = list.get(i);
                    if (value != null) {
                        sb.append('\'').append(value).append("', ");
                    } else {
                        sb.append(value).append(", ");
                    }
                }
                Object value = list.get(list.size() - 1);
                if (value != null) {
                    sb.append('\'').append(value).append("')");
                } else {
                    sb.append(value).append(')');
                }
            }

            protected final void appendEnumSet(EnumDataType enumDataType, List<Object> list, StringBuilder sb) {
                sb.append("(");
                for (int i = 0; i < list.size() - 1; i++) {
                    Object value = list.get(i);
                    if (value != null) {
                        sb.append(enumFullValue(enumDataType, value.toString())).append(", ");
                    } else {
                        sb.append(value).append(", ");
                    }
                }
                Object value = list.get(list.size() - 1);
                if (value != null) {
                    sb.append(enumFullValue(enumDataType, value.toString())).append(")");
                } else {
                    sb.append(value).append(')');
                }
            }

            protected final void appendSet(List<Object> list, StringBuilder sb) {
                sb.append("(");
                if (list.size() != 0) {
                    for (int i = 0; i < list.size() - 1; i++) {
                        sb.append(list.get(i)).append(", ");
                    }
                    sb.append(list.get(list.size() - 1));
                }
                sb.append(")");
            }

            protected final Type set(boolean in, String... values) throws WrongTypeException {
                Set<Object> parsed = new HashSet<>();
                boolean hasNull = false;
                for (String v : values) {
                    if (v == null) {
                        hasNull = true;
                    } else {
                        Object parsedObject = parseValue(dataType, v);
                        if (parsedObject == null) {
                            hasNull = true;
                        } else {
                            parsed.add(parsedObject);
                        }
                    }
                }
                if (parsed.isEmpty()) {
                    if (hasNull) {
                        if (in) {
                            return isNull();
                        } else {
                            return notNull();
                        }
                    }
                    return Type.this;
                }
                StringBuilder sb = new StringBuilder();
                sb.append('(');
                if (in) {
                    sb.append(getFullName()).append(" in ");
                } else {
                    sb.append(getFullName()).append(" not in ");
                }
                List<Object> list = new ArrayList<>(parsed);
                if (dataType instanceof VarcharDataType) {
                    appendStringSet(list, sb);
                } else if (dataType instanceof EnumDataType) {
                    appendEnumSet((EnumDataType) dataType, list, sb);
                } else {
                    appendSet(list, sb);
                }
                if (hasNull) {
                    if (in) {
                        sb.append(" or ").append(getFullName());
                        sb.append(" = null");
                    } else {
                        sb.append(" and ").append(getFullName());
                        sb.append(" != null");
                    }
                }
                sb.append(')');
                options.add(sb.toString());
                return Type.this;
            }

            protected final Type compare(String value, String operator) throws WrongTypeException {
                Object o = parseValue(dataType, value);
                if (value != null && dataType instanceof VarcharDataType) {
                    options.add('(' + getFullName() + ' ' + operator + " '" + o + "'" + ')');
                } else if (value != null && dataType instanceof EnumDataType) {
                    options.add('(' + getFullName() + ' ' + operator + ' ' + enumFullValue((EnumDataType) dataType, value) + ')');
                } else {
                    options.add('(' + getFullName() + ' ' + operator + ' ' + o + ')');
                }
                return Type.this;
            }

            public final Type like(String template) {
                options.add('(' + getFullName() + " like '" + template + "')");
                return Type.this;
            }

            public final Type notLike(String template) {
                options.add('(' + getFullName() + " not like '" + template + "')");
                return Type.this;
            }

            private String enumFullValue(EnumDataType enumDataType, String value) {
                return String.format("\"%s\":\"%s\"", enumDataType.getDescriptor().getName(), value);
            }

            protected final Object parseValue(DataType dataType, String value) throws WrongTypeException {
                try {
                    if (value == null || value.equalsIgnoreCase(SpecialValue.MINUS_INF.name)
                            || value.equalsIgnoreCase(SpecialValue.PLUS_INF.name)
                            || value.equalsIgnoreCase(SpecialValue.NAN.name)
                            || value.equalsIgnoreCase(SpecialValue.NULL.name)) {
                        return null;
                    }
                    if (dataType instanceof DateTimeDataType) {
                        Object object;
                        try {
                            long longValue = Long.parseLong(value);
                            object = dateTimeLiteral(longValue);
                        } catch (NumberFormatException exc) {
                            Instant instantValue = Instant.parse(value);
                            object = dateTimeLiteral(instantValue);
                        }
                        return object;
                    } else if (dataType instanceof EnumDataType) {
                        EnumDataType enumDataType = (EnumDataType) dataType;
                        if (parseEnum(enumDataType, value)) {
                            return value;
                        } else if (value.equalsIgnoreCase("null")) {
                            return null;
                        }
                        throw new WrongTypeException(getFullName(), value, dataType);
                    }
                    return RawMessageHelper.parseValue(dataType, value);
                } catch (IllegalArgumentException exc) {
                    throw new WrongTypeException(getFullName(), value, dataType);
                }
            }

            protected String getFullName() {
                return String.format("\"%s\":\"%s\"", typeName, fieldName);
            }

            protected DataType getDataType() {
                return dataType;
            }

        }
    }

    private boolean parseEnum(EnumDataType enumDataType, String value) {
        return enumCache.computeIfAbsent(
                enumDataType.descriptor.getName(),
                key -> Arrays.stream(enumDataType.descriptor.getSymbols()).map(String::toLowerCase).collect(Collectors.toSet())
        ).contains(value.toLowerCase());
    }

    private final class InstrumentMessageType extends Type {

        private final SpecialField symbolField;
        //private final SpecialField instrumentTypeField;
        private final SpecialField timestampField;

        InstrumentMessageType() {
            super(InstrumentMessage.class.getName(), new HashMap<>());
            symbolField = new SpecialField(SYMBOL, SYMBOL_DT);
            //instrumentTypeField = new SpecialField(INSTRUMENT_TYPE, INSTRUMENT_TYPE_DT);
            timestampField = new SpecialField(TIMESTAMP, TIMESTAMP_DT);
        }

        public Type.Field symbol() {
            return symbolField;
        }

        public Type.Field timestamp() {
            return timestampField;
        }

        final class SpecialField extends Field {

            SpecialField(String name, DataType dataType) {
                super(name, dataType);
            }

            protected String getFullName() {
                return fieldName;
            }

        }
    }

    public enum SpecialValue {
        NULL("Null"),
        NAN("NaN"),
        PLUS_INF("+Infinity"),
        MINUS_INF("-Infinity");

        private final String name;

        SpecialValue(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public static SpecialValue fromName(String name) {
            switch (name.toLowerCase()) {
                case "null":
                    return NULL;
                case "nan":
                    return NAN;
                case "+infinity":
                    return PLUS_INF;
                case "-infinity":
                    return MINUS_INF;
                default:
                    throw new UnsupportedOperationException();
            }
        }
    }


    public class NoSuchFieldException extends ValidationException {

        private final String field;

        public NoSuchFieldException(String field) {
            this.field = field;
        }

        @Override
        public String getMessage() {
            return String.format("There's no field %s in descriptors of stream %s", field, stream.getKey());
        }

        @Override
        public String toString() {
            return "{\"type\":\"NoSuchField\",\"field\":\"" + field + "\"}";
        }
    }

    public class NoSuchTypeException extends ValidationException {

        private final String type;

        public NoSuchTypeException(String type) {
            this.type = type;
        }

        @Override
        public String getMessage() {
            return String.format("There's no type %s in descriptors of stream %s", type, stream.getKey());
        }

        @Override
        public String toString() {
            return "{\"type\":\"NoSuchType\",\"type\":\"" + type + "\"}";
        }
    }

    public static class WrongTypeException extends ValidationException {
        private final String field;
        private final String value;
        private final DataType expected;

        public WrongTypeException(String field, String value, DataType expected) {
            this.field = field;
            this.value = value;
            this.expected = expected;
        }

        @Override
        public String getMessage() {
            return String.format("Couldn't parse value %s to datatype %s for field %s.", value,
                    expected.getClass().getSimpleName(), field);
        }

        @Override
        public String toString() {
            return "{\"type\":\"WrongType\",\"field\":\"" + field + "\",\"value\":\"" + value + "\",\"expected\":\"" +
                    expected.getClass().getSimpleName() + "\"}";
        }
    }

    private static String shortType(String fullType) {
        return fullType.substring(fullType.lastIndexOf(".") + 1);
    }

}
