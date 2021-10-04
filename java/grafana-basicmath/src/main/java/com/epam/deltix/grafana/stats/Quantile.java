package com.epam.deltix.grafana.stats;

import com.epam.deltix.computations.data.base.*;
import com.epam.deltix.grafana.TimeSaver;
import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.numeric.MutableDoubleValue;
import com.epam.deltix.grafana.base.Aggregation;

import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.grafana.util.AvlTreeWrapper;

import java.util.Collection;
import java.util.List;

@GrafanaAggregation(
        name = "quantile", group = "statistics",
        fieldArguments = {@FieldArgument(name = Quantile.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = Quantile.QUANTILE, type = ArgumentType.FLOAT64, defaultValue = "0.75", min = "0", max = "1")},
        returnFields = {@ReturnField(ValueType.DOUBLE)},
        doc = "Quantile aggregation on some time interval."
)
public class Quantile implements Aggregation {

    public static final String FIELD = "field";
    public static final String QUANTILE = "quantile";

    private final String fieldName;
    private final double quantile;
    private final TimeSaver timeSaver;

    private final List<Field> resultFields = new ObjectArrayList<>();
    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDoubleValue doubleValue = new MutableDoubleValue();
    private final AvlTreeWrapper<Double> avlTree = new AvlTreeWrapper<>();

    public Quantile(String fieldName, double quantile, long start, long end, long interval, String resultName) {
        this.fieldName = fieldName;
        this.quantile = quantile;
        this.timeSaver = TimeSaver.createPretty(start, end, interval);
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), doubleValue);
    }

    public Quantile(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getDouble(QUANTILE), arguments.getStart(), arguments.getEnd(),
                arguments.getInterval(), arguments.getResultField());
    }


    @Override
    public Collection<Field> fields() {
        return resultFields;
    }

    @Override
    public boolean add(GenericRecord record) throws RecordValidationException {
        boolean ready = timeSaver.put(record.timestamp());
        if (ready) {
            Double q = avlTree.quantile(quantile);
            if (q == null) {
                doubleValue.setNull();
            } else {
                doubleValue.set(q);
            }
            avlTree.clear();
            resultRecord.setTimestamp(timeSaver.getReadyTimestamp());
        }
        if (record.getValue(fieldName) != null && record.getValue(fieldName).isNotNull()) {
            avlTree.add(record.getValue(fieldName).doubleValue());
        }
        return ready;
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
        Double q = avlTree.quantile(quantile);
        if (q == null) {
            doubleValue.setNull();
        } else {
            doubleValue.set(q);
        }
        avlTree.clear();
        resultRecord.setTimestamp(timeSaver.getEnd());
        return resultRecord;
    }
}
