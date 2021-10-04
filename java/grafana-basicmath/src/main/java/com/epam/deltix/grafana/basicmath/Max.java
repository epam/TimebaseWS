package com.epam.deltix.grafana.basicmath;

import com.epam.deltix.computations.data.base.*;
import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.numeric.MutableDoubleValue;
import com.epam.deltix.grafana.TimeSaver;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;
import com.epam.deltix.grafana.data.NumericField;

import java.util.Collection;
import java.util.Collections;

@GrafanaAggregation(
        group = "basicmath", name = "max",
        fieldArguments = {@FieldArgument(name = Max.FIELD, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DOUBLE)},
        doc = "Max value on some time interval"
)
public class Max implements Aggregation, Reusable {

    public static final String FIELD = "field";

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDoubleValue maxValue = new MutableDoubleValue();
    private final TimeSaver timeSaver;
    private final NumericField resultField = new NumericField();
    private final Collection<Field> fields = Collections.singletonList(resultField);

    private String fieldName;
    private double max = GenericValueInfo.DOUBLE_NULL;

    public Max(String fieldName, long interval, String resultName, long start, long end) {
        this.fieldName = fieldName;
        this.resultField.setName(resultName);
        this.timeSaver = TimeSaver.createPretty(start, end, interval);
        resultRecord.set(resultField.name(), maxValue);
    }

    public Max(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getInterval(), arguments.getResultField(), arguments.getStart(), arguments.getEnd());
    }

    @Override
    public boolean add(GenericRecord record) {
        boolean ready = timeSaver.put(record.timestamp());
        if (ready) {
            maxValue.set(max);
            max = GenericValueInfo.DOUBLE_NULL;
            resultRecord.setTimestamp(timeSaver.getReadyTimestamp());
        }
        if (record.getValue(fieldName) != null && !record.getValue(fieldName).isNull()) {
            double v = record.getValue(fieldName).doubleValue();
            if (Double.isNaN(max) || v > max) {
                max = v;
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
    public GenericRecord calculateLast() {
        maxValue.set(max);
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
        max = GenericValueInfo.DOUBLE_NULL;
        maxValue.set(max);
    }

}
