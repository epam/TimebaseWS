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
package com.epam.deltix.grafana.stats;

import com.epam.deltix.computations.data.base.*;
import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.containers.generated.DecimalLongDataQueue;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.numeric.MutableDecimalValue;
import com.epam.deltix.grafana.base.Aggregation;

import com.epam.deltix.grafana.model.fields.Field;

import javax.naming.OperationNotSupportedException;
import java.util.Collection;
import java.util.List;

import static com.epam.deltix.computations.utils.AggregationsUtils.isValidTimestamp;

@GrafanaFunction(
        name = "sma_time", group = "statistics",
        fieldArguments = {@FieldArgument(name = TimeSMA.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = TimeSMA.INTERVAL, type = ArgumentType.INT64, defaultValue = "10000", min = "1", doc = "time interval in milliseconds")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)},
        doc = "Simple moving average on time interval"
)
public class TimeSMA implements Aggregation {

    public static final String FIELD = "field";
    public static final String INTERVAL = "interval";

    private final String fieldName;
    private final List<Field> resultFields = new ObjectArrayList<>();
    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDecimalValue decimalValue = new MutableDecimalValue();
    private final DecimalLongDataQueue queue;

    public TimeSMA(String fieldName, long interval, String resultName) {
        this.fieldName = fieldName;
        this.queue = new DecimalLongDataQueue(interval, true);
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), decimalValue);
    }

    @Override
    public boolean add(GenericRecord record) {
        GenericValueInfo value = record.getValue(fieldName);
        if (value != null && !value.isNull() && isValidTimestamp(record.timestamp())) {
            try {
                queue.put(record.getValue(fieldName).decimalValue(), record.timestamp());
            } catch (OperationNotSupportedException e) {
                e.printStackTrace();
            }
            return true;
        }
        return false;
    }

    public TimeSMA(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getLong(INTERVAL), arguments.getResultField());
    }

    @Override
    public Collection<Field> fields() {
        return resultFields;
    }

    @Override
    public GenericRecord record(long timestamp) {
        decimalValue.setDecimal(queue.arithmeticMean());
        try {
            resultRecord.setTimestamp(queue.getLastElementTime());
        } catch (OperationNotSupportedException e) {
            e.printStackTrace();
        }
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return record.getValue(fieldName) != null && record.getValue(fieldName).isNumeric() && isValidTimestamp(record.timestamp());
    }
}
