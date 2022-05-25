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
        name = "sma_count", group = "statistics",
        fieldArguments = {@FieldArgument(name = CountSMA.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = CountSMA.COUNT, type = ArgumentType.INT32, defaultValue = "100", min = "1")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)},
        doc = "Simple moving average on some points count."
)
public class CountSMA implements Aggregation {

    public static final String FIELD = "field";
    public static final String COUNT = "count";

    private final String fieldName;
    private final List<Field> resultFields = new ObjectArrayList<>();
    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDecimalValue decimalValue = new MutableDecimalValue();
    private final DecimalLongDataQueue queue;

    public CountSMA(String fieldName, int count, String resultName) {
        this.fieldName = fieldName;
        this.queue = new DecimalLongDataQueue(count, true, false);
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), decimalValue);
    }

    public CountSMA(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getInt(COUNT), arguments.getResultField());
    }

    @Override
    public boolean add(GenericRecord record) {
        if (record.containsNonNull(fieldName)) {
            try {
                queue.put(record.getValue(fieldName).decimalValue());
            } catch (OperationNotSupportedException e) {
                e.printStackTrace();
            }
            resultRecord.setTimestamp(record.timestamp());
            decimalValue.setDecimal(queue.arithmeticMean());
            return true;
        }
        return false;
    }

    @Override
    public Collection<Field> fields() {
        return resultFields;
    }

    @Override
    public GenericRecord record(long timestamp) {
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return record.getValue(fieldName) != null && record.getValue(fieldName).isNumeric() && isValidTimestamp(record.timestamp());
    }
}
