package com.epam.deltix.computations.data.base.time;

import com.epam.deltix.util.annotations.TimestampMs;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableTimestampValueInfo extends TimestampValueInfo, MutableGenericValueInfo {

    @Override
    void setTimestamp(@TimestampMs long value);

    @Override
    default void setNull() {
        setTimestamp(TIMESTAMP_NULL);
    }
}
