package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableLongValueInfo;

public class MutableLongValue implements MutableLongValueInfo, Reusable {

    private long value;

    public MutableLongValue(long value) {
        this.value = value;
    }

    public MutableLongValue() {
        this.value = LONG_NULL;
    }

    @Override
    public void reuse() {
        value = LONG_NULL;
    }

    @Override
    public long longValue() {
        return value;
    }

    @Override
    public void set(long value) {
        this.value = value;
    }

    public static MutableLongValue of(long value) {
        return new MutableLongValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
