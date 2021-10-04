package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;

public interface ByteValueInfo extends NumberValueInfo {

    @Override
    byte byteValue();

    @Override
    default Byte value() {
        return isNull() ? null: byteValue();
    }

    @Override
    default short shortValue() {
        return isNull() ? SHORT_NULL: byteValue();
    }

    @Override
    default int intValue() {
        return isNull() ? INT_NULL: byteValue();
    }

    @Override
    default long longValue() {
        return isNull() ? LONG_NULL: byteValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: byteValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: byteValue();
    }

    @Decimal
    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromInt(byteValue());
    }

    @Override
    default boolean isNull() {
        return byteValue() == BYTE_NULL;
    }
}
