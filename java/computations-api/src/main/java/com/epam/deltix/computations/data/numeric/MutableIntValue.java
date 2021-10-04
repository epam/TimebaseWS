package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableIntValueInfo;

public class MutableIntValue implements MutableIntValueInfo, Reusable {

    private int value;

    public MutableIntValue() {
        this.value = INT_NULL;
    }

    public MutableIntValue(int value) {
        this.value = value;
    }

    @Override
    public void reuse() {
        value = INT_NULL;
    }

    @Override
    public int intValue() {
        return value;
    }

    @Override
    public void set(int value) {
        this.value = value;
    }

    public static MutableIntValue of(int value) {
        return new MutableIntValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
