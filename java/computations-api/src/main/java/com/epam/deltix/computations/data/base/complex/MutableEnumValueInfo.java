package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableEnumValueInfo extends EnumValueInfo, MutableGenericValueInfo {

    @Override
    void setEnum(CharSequence value, long ordinal);

    @Override
    default void set(CharSequence value) {
        setEnum(value, LONG_NULL);
    }

    @Override
    default void set(long value) {
        setEnum(null, value);
    }

    @Override
    default void setNull() {
        setEnum(null, LONG_NULL);
    }
}
