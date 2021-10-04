package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableDoubleValueInfo extends DoubleValueInfo, MutableGenericValueInfo {

    @Override
    void set(double value);

    @Override
    default void setNull() {
        set(GenericValueInfo.DOUBLE_NULL);
    }

    @Override
    default void set(byte value) {
        set((double) value);
    }

    @Override
    default void set(short value) {
        set((double) value);
    }

    @Override
    default void set(int value) {
        set((double) value);
    }

    @Override
    default void set(long value) {
        set((double) value);
    }

    @Override
    default void set(float value) {
        set((double) value);
    }

    @Override
    default void setDecimal(@Decimal long value) {
        set(Decimal64Utils.toDouble(value));
    }
}
