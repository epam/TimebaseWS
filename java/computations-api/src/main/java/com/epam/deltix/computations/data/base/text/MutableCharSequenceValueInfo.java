package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.util.annotations.Alphanumeric;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableCharSequenceValueInfo extends CharSequenceValueInfo, MutableGenericValueInfo {

    @Override
    void set(CharSequence value);

    @Override
    void setAlphanumeric(@Alphanumeric long value);

    @Override
    default void setNull() {
        set(null);
    }
}
