package com.epam.deltix.computations.data.time;

import com.epam.deltix.util.annotations.TimestampMs;
import com.epam.deltix.computations.data.base.time.MutableTimestampValueInfo;

public class MutableTimestampValue implements MutableTimestampValueInfo {

    @TimestampMs
    private long value;

    public MutableTimestampValue(@TimestampMs long value) {
        this.value = value;
    }

    public MutableTimestampValue() {
        this(TIMESTAMP_NULL);
    }

    @TimestampMs
    @Override
    public long timestampValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = TIMESTAMP_NULL;
    }

    @Override
    public void setTimestamp(@TimestampMs long value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
