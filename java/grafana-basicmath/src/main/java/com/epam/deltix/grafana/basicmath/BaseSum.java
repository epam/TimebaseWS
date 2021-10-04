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

import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.numeric.MutableDoubleValue;
import com.epam.deltix.grafana.TimeSaver;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.data.NumericField;

import java.util.Collection;
import java.util.Collections;

public class BaseSum implements Aggregation, Reusable {
    public static final String FIELD = "field";

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDoubleValue sumValue = new MutableDoubleValue();
    private final TimeSaver timeSaver;
    private final boolean makeZero;
    private final NumericField resultField = new NumericField();
    private final Collection<Field> fields = Collections.singletonList(resultField);

    private String fieldName;
    private double sum = 0;

    public BaseSum(String fieldName, long interval, String resultName, long start, long end, boolean makeZero) {
        this.fieldName = fieldName;
        this.makeZero = makeZero;
        this.resultField.setName(resultName);
        this.timeSaver = TimeSaver.createPretty(start, end, interval);
        resultRecord.set(resultField.name(), sumValue);
    }

    public BaseSum(Arguments arguments, boolean makeZero) {
        this(arguments.getString(FIELD), arguments.getInterval(), arguments.getResultField(), arguments.getStart(),
                arguments.getEnd(), makeZero);
    }

    @Override
    public boolean add(GenericRecord record) {
        boolean ready = timeSaver.put(record.timestamp());
        if (ready) {
            sumValue.set(sum);
            if (makeZero) {
                sum = 0;
            }
            resultRecord.setTimestamp(timeSaver.getReadyTimestamp());
        }
        if (record.getValue(fieldName) != null && !record.getValue(fieldName).isNull()) {
            double v = record.getValue(fieldName).doubleValue();
            sum += v;
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
        sumValue.set(sum);
        resultRecord.setTimestamp(timeSaver.getEnd());
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return record.getValue(fieldName) == null ||
                record.getValue(fieldName).isNull() ||
                record.getValue(fieldName).isNumeric();
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
        reuse();
    }

    @Override
    public void reuse() {
        sum = 0;
        sumValue.set(sum);
    }
}
