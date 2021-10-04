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
        name = "last", group = "select",
        fieldArguments = {@FieldArgument(name = Last.FIELD, types = GrafanaValueType.ANY)},
        returnFields = {@ReturnField(ValueType.INPUT)}
)
public class Last implements Aggregation {

    public static final String FIELD = "field";

    private final TimeSaver timeSaver;
    private final String fieldName;

    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableField resultField = new MutableField();
    private final MutableGenericValueFactory currentFactory = new MutableGenericValueFactory();
    private final MutableGenericValueFactory dynamicFactory = new MutableGenericValueFactory();
    private final Collection<Field> fields = Collections.singletonList(resultField);

    private GenericValueInfo last;
    private GenericValueInfo current;

    public Last(String fieldName, long interval, String resultName, long start, long end) {
        this.fieldName = fieldName;
        this.resultField.setName(resultName);
        this.timeSaver = TimeSaver.createPretty(start, end, interval);
    }

    public Last(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getInterval(), arguments.getResultField(), arguments.getStart(), arguments.getEnd());
    }

    @Override
    public boolean add(GenericRecord record) {
        boolean ready = timeSaver.put(record.timestamp());
        GenericValueInfo value = record.getValue(fieldName);
        if (value != null && !value.isNull()) {
            if (value.isNumeric()) {
                resultField.setFieldType(FieldType.NUMBER);
            } else if (value.isText()) {
                resultField.setFieldType(FieldType.STRING);
            }
            if (current == null) {
                current = currentFactory.copy(value);
                last = dynamicFactory.copy(value);
                resultRecord.set(resultField.name(), current);
            }
            if (ready) {
                currentFactory.reuse();
                current = currentFactory.copy(last);
                resultRecord.set(resultField.name(), current);
                resultRecord.setTimestamp(timeSaver.getReadyTimestamp());
            }
            dynamicFactory.reuse();
            last = dynamicFactory.copy(value);
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
        if (last == null)
            return null;
        currentFactory.reuse();
        current = currentFactory.copy(last);
        resultRecord.set(resultField.name(), current);
        resultRecord.setTimestamp(timeSaver.getEnd());
        return resultRecord;
    }
}
