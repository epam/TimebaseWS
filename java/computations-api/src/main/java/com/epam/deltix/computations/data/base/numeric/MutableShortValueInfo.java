package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableShortValueInfo extends ShortValueInfo, MutableGenericValueInfo {

    @Override
    void set(short value);

    @Override
    default void setNull() {
        set(GenericValueInfo.SHORT_NULL);
    }

    @Override
    default void set(byte value) {
        set((short) value);
    }

    @Override
    default void set(int value) {
        set((short) value);
    }

    @Override
    default void set(long value) {
        set((short) value);
    }
}
