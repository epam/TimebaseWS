package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableBooleanValueInfo extends BooleanValueInfo, MutableGenericValueInfo {

    @Override
    void set(byte value);

    @Override
    default void set(boolean value) {
        set((byte) (value ? 1 : 0));
    }

    @Override
    default void setNull() {
        set(BOOLEAN_NULL);
    }
}
