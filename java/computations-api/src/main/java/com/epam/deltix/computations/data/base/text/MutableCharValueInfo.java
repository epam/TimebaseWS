package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableCharValueInfo extends CharValueInfo, MutableGenericValueInfo {

    @Override
    void set(char value);

    @Override
    default void setNull() {
        set(CHAR_NULL);
    }
}
