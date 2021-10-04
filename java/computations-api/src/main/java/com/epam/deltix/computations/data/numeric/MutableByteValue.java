package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.data.base.numeric.MutableByteValueInfo;
import com.epam.deltix.computations.utils.Reusable;

public class MutableByteValue implements MutableByteValueInfo, Reusable {

    private byte value;

    public MutableByteValue(byte value) {
        this.value = value;
    }

    public MutableByteValue() {
        this.value = BYTE_NULL;
    }

    @Override
    public byte byteValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = BYTE_NULL;
    }

    @Override
    public void set(byte value) {
        this.value = value;
    }

    public static MutableByteValue of(byte value) {
        return new MutableByteValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
