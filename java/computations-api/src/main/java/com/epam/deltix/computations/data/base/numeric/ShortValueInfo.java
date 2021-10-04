package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;

public interface ShortValueInfo extends NumberValueInfo {

    short shortValue();

    @Override
    default Short value() {
        return isNull() ? null: shortValue();
    }

    @Override
    default int intValue() {
        return isNull() ? INT_NULL: shortValue();
    }

    @Override
    default long longValue() {
        return isNull() ? LONG_NULL: shortValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: shortValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: shortValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromInt(shortValue());
    }

    @Override
    default boolean isNull() {
        return shortValue() == SHORT_NULL;
    }
}
