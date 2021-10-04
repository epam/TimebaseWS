package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.util.annotations.Alphanumeric;

public interface AlphanumericValueInfo extends GenericValueInfo {

    @Alphanumeric
    long alphanumericValue();

    @Alphanumeric
    @Override
    default long longValue() {
        return alphanumericValue();
    }

    @Override
    default String value() {
        return AlphanumericUtils.toString(longValue());
    }

    @Override
    default boolean isText() {
        return true;
    }

    @Override
    default boolean isNull() {
        return alphanumericValue() == LONG_NULL;
    }

}
