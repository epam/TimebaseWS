package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableByteValueInfo extends ByteValueInfo, MutableGenericValueInfo {

    @Override
    void set(byte value);

    @Override
    default void setNull() {
        set(GenericValueInfo.BYTE_NULL);
    }

    @Override
    default void set(short value) {
        set((byte) value);
    }

    @Override
    default void set(int value) {
        set((byte) value);
    }

    @Override
    default void set(long value) {
        set((byte) value);
    }
}
