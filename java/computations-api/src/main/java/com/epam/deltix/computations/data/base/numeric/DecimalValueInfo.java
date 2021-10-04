package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.*;

public interface DecimalValueInfo extends NumberValueInfo {

    @Override
    @Decimal
    long decimalValue();

    @Decimal
    @Override
    default Decimal64 value() {
        return isNull() ? null: decimal64Value();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: (float) Decimal64Utils.toDouble(decimalValue());
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: Decimal64Utils.toDouble(decimalValue());
    }

    @Override
    default boolean isNull() {
        return decimalValue() == DECIMAL_NULL;
    }
}
