package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableBooleanValueInfo;

public class MutableBooleanValue implements MutableBooleanValueInfo, Reusable {

    private byte value;

    public MutableBooleanValue(byte value) {
        this.value = value;
    }

    public MutableBooleanValue() {
        this(BOOLEAN_NULL);
    }

    @Override
    public void reuse() {
        value = BOOLEAN_NULL;
    }

    @Override
    public byte booleanValue() {
        return value;
    }

    public void set(byte value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
