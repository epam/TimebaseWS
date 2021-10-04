package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableShortValueInfo;

public class MutableShortValue implements MutableShortValueInfo, Reusable {

    private short value;

    public MutableShortValue() {
        this.value = SHORT_NULL;
    }

    public MutableShortValue(short value) {
        this.value = value;
    }

    @Override
    public void reuse() {
        value = SHORT_NULL;
    }

    @Override
    public short shortValue() {
        return value;
    }

    @Override
    public void set(short value) {
        this.value = value;
    }

    public static MutableShortValue of(short value) {
        return new MutableShortValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
