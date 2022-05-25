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
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.numeric.MutableDecimalValue;
import com.epam.deltix.grafana.base.Aggregation;

import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.List;

import static com.epam.deltix.dfp.Decimal64Utils.*;

@GrafanaFunction(
        name = "ema", group = "statistics",
        fieldArguments = {@FieldArgument(name = ExponentialMovingAverage.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = ExponentialMovingAverage.PERIOD, type = ArgumentType.INT32, defaultValue = "14")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)},
        doc = "Exponential moving average."
)
public class ExponentialMovingAverage implements Aggregation {

    public static final String FIELD = "field";
    public static final String PERIOD = "period";

    private final String fieldName;
    private final int period;
    private final @Decimal long factor;
    private final List<Field> resultFields = new ObjectArrayList<>();
    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDecimalValue decimalValue = new MutableDecimalValue();

    private long count = 0;
    private @Decimal long sum = Decimal64Utils.ZERO;
    private @Decimal long average = Decimal64Utils.NULL;

    public ExponentialMovingAverage(String fieldName, int period, String resultName) {
        this.fieldName = fieldName;
        this.period = period;
        this.factor = divideByInteger(Decimal64Utils.TWO, period + 1);
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), decimalValue);
    }

    public ExponentialMovingAverage(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getInt(PERIOD), arguments.getResultField());
    }

    @Override
    public Collection<Field> fields() {
        return resultFields;
    }

    @Override
    public boolean add(GenericRecord record) {
        if (record.containsNonNull(fieldName)) {
            @Decimal long value = record.getValue(fieldName).decimalValue();
            ++count;
            if (count < period) {
                sum = Decimal64Utils.add(sum, value);
                average = divideByInteger(sum, count);
            } else {
                average = Decimal64Utils.add(average, multiply(factor, subtract(value, average)));
            }
            decimalValue.setDecimal(average);
            resultRecord.setTimestamp(record.timestamp());
            return true;
        }
        return false;
    }

    @Override
    public GenericRecord record(long timestamp) {
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return true;
    }
}
