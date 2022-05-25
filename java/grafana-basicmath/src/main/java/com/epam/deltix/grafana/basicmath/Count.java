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
package com.epam.deltix.grafana.basicmath;

import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.computations.data.numeric.MutableLongValue;
import com.epam.deltix.grafana.TimeSaver;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;
import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.Collections;

@GrafanaAggregation(
        group = "basicmath", name = "count",
        fieldArguments = {@FieldArgument(name = Count.FIELD, types = {GrafanaValueType.ANY})},
        returnFields = {@ReturnField(ValueType.LONG)},
        doc = "Counts nonnull values in a time interval."
)
public class Count implements Aggregation, Reusable {

    public static final String FIELD = "field";

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableLongValue longValue = new MutableLongValue(0);
    private final TimeSaver timeSaver;
    private String fieldName;
    private final NumericField resultField = new NumericField();
    private long counter = 0;

    private final Collection<Field> fields = Collections.singletonList(resultField);

    public Count(String fieldName, long interval, String resultName, long start, long end) {
        this.fieldName = fieldName;
        this.resultField.setName(resultName);
        this.timeSaver = TimeSaver.createPretty(start, end, interval);
        resultRecord.set(resultField.name(), longValue);
    }

    public Count(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getInterval(), arguments.getResultField(), arguments.getStart(), arguments.getEnd());
    }

    @Override
    public boolean add(GenericRecord record) {
        boolean ready = timeSaver.put(record.timestamp());
        if (ready) {
            longValue.set(counter);
            counter = 0;
            resultRecord.setTimestamp(timeSaver.getReadyTimestamp());
        }
        if (record.getValue(fieldName) != null && !record.getValue(fieldName).isNull()) {
            counter++;
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
    public GenericRecord calculateLast() {
        longValue.set(counter);
        resultRecord.setTimestamp(timeSaver.getEnd());
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return true;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
        reuse();
    }

    @Override
    public void reuse() {
        counter = 0;
        longValue.set(0);
    }
}

