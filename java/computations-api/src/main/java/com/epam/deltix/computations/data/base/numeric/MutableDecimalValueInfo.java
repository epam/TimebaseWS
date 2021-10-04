package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableDecimalValueInfo extends DecimalValueInfo, MutableGenericValueInfo {

    @Override
    void setDecimal(@Decimal long value);

    @Override
    default void setNull() {
        setDecimal(GenericValueInfo.DECIMAL_NULL);
    }

    @Override
    default void set(byte value) {
        setDecimal(Decimal64Utils.fromInt(value));
    }

    @Override
    default void set(short value) {
        setDecimal(Decimal64Utils.fromInt(value));
    }

    @Override
    default void set(int value) {
        setDecimal(Decimal64Utils.fromInt(value));
    }

    @Override
    default void set(long value) {
        setDecimal(Decimal64Utils.fromLong(value));
    }

    @Override
    default void set(float value) {
        setDecimal(Decimal64Utils.fromDouble(value));
    }

    @Override
    default void set(double value) {
        setDecimal(Decimal64Utils.fromDouble(value));
    }
}
