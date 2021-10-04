package com.epam.deltix.grafana.base;

import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.computations.base.TimebaseFunction;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.base.GenericRecord;

import java.util.Collection;

/**
 * Aggregation, that applies specific function on time interval.
 * Time interval is final and must be defined in constructor.
 */
public interface Aggregation extends TimebaseFunction {

    /**
     * List of fields
     *
     * @return fields descriptions
     */
    Collection<Field> fields();

    /**
     * Composition of two aggregations.
     *
     * @param other aggregation to apply after current
     * @return new aggregation, that represents compositon of two others
     */
    default Aggregation andThen(Aggregation other) {
        return composition(this, other);
    }

    static Aggregation composition(Aggregation first, Aggregation second) {
        return new Aggregation() {
            @Override
            public boolean add(GenericRecord record) throws RecordValidationException {
                if (first.add(record)) {
                    GenericRecord r = first.record(record.timestamp());
                    if (second.isValid(r)) {
                        return second.add(r);
                    } else {
                        throw new RecordValidationException(r, second);
                    }
                }
                return false;
            }

            @Override
            public Collection<Field> fields() {
                return second.fields();
            }

            @Override
            public GenericRecord record(long timestamp) {
                return second.record(timestamp);
            }

            @Override
            public boolean isValid(GenericRecord record) {
                return first.isValid(record);
            }

            @Override
            public GenericRecord calculateLast() {
                return second.calculateLast();
            }
        };
    }

}
