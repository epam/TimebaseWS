package com.epam.deltix.grafana.doublemath;

import com.epam.deltix.containers.generated.DoubleDoubleToDoubleFunction;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.numeric.MutableDoubleValue;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.List;

public class ConstantOperator implements Aggregation {

    public static final String FIELD = "field";
    public static final String OPERAND = "operand";

    private final String fieldName;
    private final double operand;
    private final DoubleDoubleToDoubleFunction function;

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDoubleValue value = new MutableDoubleValue();
    private final List<Field> resultFields = new ObjectArrayList<>();

    public ConstantOperator(String fieldName, String resultName, double operand, DoubleDoubleToDoubleFunction function) {
        this.fieldName = fieldName;
        this.operand = operand;
        this.function = function;
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), value);
    }

    @Override
    public boolean add(GenericRecord record) {
        if (isValidField(record.getValue(fieldName)) && isValidOperand(operand)) {
            resultRecord.setTimestamp(record.timestamp());
            resultRecord.setRecordKey(record.recordKey());
            value.set(function.apply(record.getValue(fieldName).doubleValue(), operand));
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

    public boolean isValidField(GenericValueInfo value) {
        return value != null && value.isNumeric() && !value.isNull();
    }

    public boolean isValidOperand(double value) {
        return true;
    }
}
