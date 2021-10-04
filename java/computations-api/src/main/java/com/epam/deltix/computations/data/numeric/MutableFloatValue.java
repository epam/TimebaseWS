package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableFloatValueInfo;

public class MutableFloatValue implements MutableFloatValueInfo, Reusable {

    private float value;

    public MutableFloatValue(float value) {
        this.value = value;
    }

    public MutableFloatValue() {
        this.value = FLOAT_NULL;
    }

    @Override
    public float floatValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = FLOAT_NULL;
    }

    @Override
    public void set(float value) {
        this.value = value;
    }

    public static MutableFloatValue of(float value) {
        return new MutableFloatValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
