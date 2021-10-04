package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;

public interface DoubleValueInfo extends NumberValueInfo {

    double doubleValue();

    @Override
    default Double value() {
        return isNull() ? null: doubleValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: (float) doubleValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromDouble(doubleValue());
    }

    @Override
    default boolean isNull() {
        return Double.isNaN(doubleValue());
    }
}
