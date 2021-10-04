package com.epam.deltix.grafana.decimalmath;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.containers.generated.LongLongToLongFunction;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.numeric.MutableDecimalValue;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.List;

public class ConstantOperator implements Aggregation {

    public static final String FIELD = "field";
    public static final String OPERAND = "operand";

    private final String fieldName;
    @Decimal private final long operand;
    private final LongLongToLongFunction function;

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDecimalValue value = new MutableDecimalValue();
    private final List<Field> resultFields = new ObjectArrayList<>();

    public ConstantOperator(String fieldName, String resultName, @Decimal long operand, LongLongToLongFunction function) {
        this.fieldName = fieldName;
        this.operand = operand;
        this.function = function;
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), value);
    }

    @Override
    public boolean add(GenericRecord record) {
        if (record.containsNonNull(fieldName)) {
            resultRecord.setTimestamp(record.timestamp());
            resultRecord.setRecordKey(record.recordKey());
            value.setDecimal(function.apply(record.getValue(fieldName).decimalValue(), operand));
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
        return true;
    }
}
