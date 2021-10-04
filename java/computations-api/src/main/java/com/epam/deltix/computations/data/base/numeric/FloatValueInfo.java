package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;

public interface FloatValueInfo extends NumberValueInfo {

    float floatValue();

    @Override
    default Float value() {
        return floatValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: floatValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromDouble(floatValue());
    }

    @Override
    default boolean isNull() {
        return Float.isNaN(floatValue());
    }
}
