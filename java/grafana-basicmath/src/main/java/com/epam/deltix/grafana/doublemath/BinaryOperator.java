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
package com.epam.deltix.grafana.doublemath;

import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.containers.generated.DoubleDoubleToDoubleFunction;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.numeric.MutableDoubleValue;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.List;

public class BinaryOperator implements Aggregation {

    public static final String FIELD1 = "field1";
    public static final String FIELD2 = "field2";

    private final String field1;
    private final String field2;
    private final DoubleDoubleToDoubleFunction function;

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDoubleValue value = new MutableDoubleValue();
    private final List<Field> resultFields = new ObjectArrayList<>();

    public BinaryOperator(String field1, String field2, String resultName, DoubleDoubleToDoubleFunction function) {
        this.field1 = field1;
        this.field2 = field2;
        this.function = function;
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), value);
    }

    @Override
    public Collection<Field> fields() {
        return resultFields;
    }

    @Override
    public boolean add(GenericRecord record) {
        if (isValidFirst(record.getValue(field1)) && isValidSecond(record.getValue(field2))) {
            resultRecord.setTimestamp(record.timestamp());
            resultRecord.setRecordKey(record.recordKey());
            value.set(function.apply(record.getValue(field1).doubleValue(), record.getValue(field2).doubleValue()));
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

    public boolean isValidFirst(GenericValueInfo value) {
        return value != null && value.isNumeric() && !value.isNull();
    }

    public boolean isValidSecond(GenericValueInfo value) {
        return value != null && value.isNumeric() && !value.isNull();
    }
}
