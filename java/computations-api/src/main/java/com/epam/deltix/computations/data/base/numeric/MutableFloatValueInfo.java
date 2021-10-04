package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableFloatValueInfo extends FloatValueInfo, MutableGenericValueInfo {

    @Override
    void set(float value);

    @Override
    default void setNull() {
        set(GenericValueInfo.FLOAT_NULL);
    }

    @Override
    default void set(byte value) {
        set((float) value);
    }

    @Override
    default void set(short value) {
        set((float) value);
    }

    @Override
    default void set(int value) {
        set((float) value);
    }

    @Override
    default void set(long value) {
        set((float) value);
    }

    @Override
    default void set(double value) {
        set((float) value);
    }

    @Override
    default void setDecimal(long value) {
        set((float) Decimal64Utils.toDouble(value));
    }
}
