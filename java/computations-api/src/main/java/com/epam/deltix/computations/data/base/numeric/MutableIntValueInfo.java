package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableIntValueInfo extends IntValueInfo, MutableGenericValueInfo {

    @Override
    void set(int value);

    @Override
    default void setNull() {
        set(GenericValueInfo.INT_NULL);
    }

    @Override
    default void set(byte value) {
        set((int) value);
    }

    @Override
    default void set(short value) {
        set((int) value);
    }

    @Override
    default void set(long value) {
        set((int) value);
    }
}
