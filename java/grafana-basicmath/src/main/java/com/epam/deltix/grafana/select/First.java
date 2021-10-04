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
package com.epam.deltix.grafana.select;

import com.epam.deltix.computations.data.base.*;
import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.MutableGenericValueFactory;
import com.epam.deltix.grafana.TimeSaver;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;
import com.epam.deltix.grafana.model.fields.FieldType;
import com.epam.deltix.grafana.model.fields.MutableField;

import java.util.Collection;
import java.util.Collections;

@GrafanaAggregation(
        name = "first", group = "select",
        fieldArguments = {@FieldArgument(name = First.FIELD, types = GrafanaValueType.ANY)},
        returnFields = {@ReturnField(ValueType.INPUT)}
)
public class First implements Aggregation {

    public static final String FIELD = "field";

    private final TimeSaver timeSaver;
    private final String fieldName;

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableField resultField = new MutableField();
    private final MutableGenericValueFactory currentFactory = new MutableGenericValueFactory();
    private final MutableGenericValueFactory dynamicFactory = new MutableGenericValueFactory();
    private final Collection<Field> fields = Collections.singletonList(resultField);

    private GenericValueInfo first;
    private GenericValueInfo current;

    public First(String fieldName, long interval, String resultName, long start, long end) {
        this.fieldName = fieldName;
        this.resultField.setName(resultName);
        this.timeSaver = TimeSaver.createPretty(start, end, interval);
    }

    public First(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getInterval(), arguments.getResultField(), arguments.getStart(), arguments.getEnd());
    }

    @Override
    public boolean add(GenericRecord record) {
        boolean ready = timeSaver.put(record.timestamp());
        GenericValueInfo value = record.getValue(fieldName);
        if (value != null && !record.isNull()) {
            if (value.isNumeric()) {
                resultField.setFieldType(FieldType.NUMBER);
            } else if (value.isText()) {
                resultField.setFieldType(FieldType.STRING);
            }
            if (current == null) {
                current = currentFactory.copy(value);
                first = dynamicFactory.copy(value);
                resultRecord.set(resultField.name(), current);
            }
            if (ready) {
                currentFactory.reuse();
                current = currentFactory.copy(first);
                resultRecord.set(resultField.name(), current);
                resultRecord.setTimestamp(timeSaver.getReadyTimestamp());
                dynamicFactory.reuse();
                first = dynamicFactory.copy(value);
            }
        }
        return ready;
    }

    @Override
    public Collection<Field> fields() {
        return fields;
    }

    @Override
    public GenericRecord record(long timestamp) {
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return true;
    }

    @Override
    public GenericRecord calculateLast() {
        if (first == null)
            return null;
        currentFactory.reuse();
        current = currentFactory.copy(first);
        resultRecord.set(resultField.name(), current);
        resultRecord.setTimestamp(timeSaver.getEnd());
        return resultRecord;
    }
}
