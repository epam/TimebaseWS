package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;

public interface LongValueInfo extends NumberValueInfo {

    long longValue();

    @Override
    default Long value() {
        return isNull() ? null: longValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: longValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: longValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromLong(longValue());
    }

    @Override
    default boolean isNull() {
        return longValue() == LONG_NULL;
    }
}
