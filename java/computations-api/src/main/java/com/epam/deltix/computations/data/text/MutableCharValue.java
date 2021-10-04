package com.epam.deltix.computations.data.text;

import com.epam.deltix.computations.data.base.text.MutableCharValueInfo;

public class MutableCharValue implements MutableCharValueInfo {

    private char value;

    public MutableCharValue(char value) {
        this.value = value;
    }

    public MutableCharValue() {
        this(CHAR_NULL);
    }

    @Override
    public void reuse() {
        value = CHAR_NULL;
    }

    @Override
    public char charValue() {
        return value;
    }

    @Override
    public void set(char value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
