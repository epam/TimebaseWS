package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableLongValueInfo extends LongValueInfo, MutableGenericValueInfo {

    @Override
    void set(long value);

    @Override
    default void setNull() {
        set(GenericValueInfo.LONG_NULL);
    }

    @Override
    default void set(byte value) {
        set((long) value);
    }

    @Override
    default void set(short value) {
        set((long) value);
    }

    @Override
    default void set(int value) {
        set((long) value);
    }
}
