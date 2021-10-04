package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;

public interface IntValueInfo extends NumberValueInfo {

    int intValue();

    @Override
    default Integer value() {
        return isNull() ? null: intValue();
    }

    @Override
    default long longValue() {
        return isNull() ? LONG_NULL: intValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: intValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: intValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromInt(intValue());
    }

    @Override
    default boolean isNull() {
        return intValue() == INT_NULL;
    }
}
