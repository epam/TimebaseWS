package com.epam.deltix.grafana;

import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.MutableGenericValueFactory;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.grafana.base.Aggregation;

import java.util.Collection;

public class PeekFieldAggregation implements Aggregation {

    private final String field;
    private final MutableGenericRecord result = new MutableGenericRecordImpl();
    private final MutableGenericValueFactory factory = new MutableGenericValueFactory();

    public PeekFieldAggregation(String field) {
        this.field = field;
    }

    @Override
    public Collection<Field> fields() {
        return null;
    }

    @Override
    public boolean add(GenericRecord record) {
        if (record.containsNonNull(field)) {
            factory.reuse();
            result.setTimestamp(record.timestamp());
            result.set(field, factory.copy(record.getValue(field)));
            return true;
        }
        return false;
    }

    @Override
    public GenericRecord record(long timestamp) {
        return result;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return true;
    }
}
