package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface CharValueInfo extends GenericValueInfo {

    char charValue();

    @Override
    default Object value() {
        return charValue();
    }

    @Override
    default boolean isText() {
        return true;
    }

    @Override
    default boolean isNull() {
        return charValue() == CHAR_NULL;
    }

}
