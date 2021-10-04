package com.epam.deltix.computations.base;

import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.base.GenericRecord;

public interface TimebaseFunction {
    
    /**
     * Process new record
     *
     * @param record record to process
     * @return <code>true</code> if {@link TimebaseFunction#record(long timestamp)} method should be called.
     * <code>false</code> in opposite case.
     * @throws RecordValidationException if provided record is not valid for current aggregation.
     */
    boolean add(GenericRecord record) throws RecordValidationException;

    /**
     * Get current state of aggregation
     *
     * @return generic record describing current state.
     */
    GenericRecord record(long timestamp);

    /**
     * This method should be called after all records added.
     * If this aggregation provides special processing of last value/interval it should return generic record.
     * In opposite case - should return null.
     *
     * @return record if special processing for last value provided, null in opposite case
     */
    default GenericRecord calculateLast() {
        return null;
    }

    /**
     * If timestamp is not required, this method should be called.
     *
     * @return current record
     */
    default GenericRecord record() {
        return record(GenericRecord.TIMESTAMP_UNDEFINED);
    }

    /**
     * Checks whether input generic record is valid for current aggregation.
     *
     * @param record generic record
     * @return true if valid, false otherwise
     */
    boolean isValid(GenericRecord record);

    /**
     * Composition of two aggregations.
     *
     * @param other aggregation to apply after current
     * @return new aggregation, that represents compositon of two others
     */
    default TimebaseFunction andThen(TimebaseFunction other) {
        return composition(this, other);
    }

    static TimebaseFunction composition(TimebaseFunction first, TimebaseFunction second) {
        return new TimebaseFunction() {
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
