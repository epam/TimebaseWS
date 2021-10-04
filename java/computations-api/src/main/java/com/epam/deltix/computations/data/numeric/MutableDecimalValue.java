package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.computations.data.base.numeric.MutableDecimalValueInfo;
import com.epam.deltix.computations.utils.Reusable;

public class MutableDecimalValue implements MutableDecimalValueInfo, Reusable {

    @Decimal
    private long value;

    public MutableDecimalValue(@Decimal long value) {
        this.value = value;
    }

    public MutableDecimalValue() {
        this.value = DECIMAL_NULL;
    }

    @Override
    @Decimal
    public long decimalValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = DECIMAL_NULL;
    }

    @Override
    public void setDecimal(@Decimal long value) {
        this.value = value;
    }

    public static MutableDecimalValue of(@Decimal long value) {
        return new MutableDecimalValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
