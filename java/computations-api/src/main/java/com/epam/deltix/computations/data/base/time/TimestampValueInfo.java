package com.epam.deltix.computations.data.base.time;

import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface TimestampValueInfo extends GenericValueInfo {

    long timestampValue();

    @Override
    default long longValue() {
        return timestampValue();
    }

    @Override
    default Object value() {
        return timestampValue();
    }

    @Override
    default boolean isNumeric() {
        return false;
    }

    @Override
    default boolean isNull() {
        return timestampValue() == TIMESTAMP_NULL;
    }
}
