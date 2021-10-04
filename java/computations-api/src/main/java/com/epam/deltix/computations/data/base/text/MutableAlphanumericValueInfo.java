package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.util.annotations.Alphanumeric;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableAlphanumericValueInfo extends AlphanumericValueInfo, MutableGenericValueInfo {

    @Override
    void setAlphanumeric(@Alphanumeric long value);

    @Override
    default void set(CharSequence value) {
        setAlphanumeric(AlphanumericUtils.toAlphanumericUInt64(value));
    }

    @Override
    default void setNull() {
        setAlphanumeric(ALPHANUMERIC_NULL);
    }
}
