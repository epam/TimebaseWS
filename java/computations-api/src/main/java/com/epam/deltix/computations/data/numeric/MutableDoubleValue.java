package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableDoubleValueInfo;

public class MutableDoubleValue implements MutableDoubleValueInfo, Reusable {

    private double value;

    public MutableDoubleValue() {
        this.value = DOUBLE_NULL;
    }

    public MutableDoubleValue(double value) {
        this.value = value;
    }

    @Override
    public double doubleValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = DOUBLE_NULL;
    }

    @Override
    public void set(double value) {
        this.value = value;
    }

    public static MutableDoubleValue of(double value) {
        return new MutableDoubleValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
