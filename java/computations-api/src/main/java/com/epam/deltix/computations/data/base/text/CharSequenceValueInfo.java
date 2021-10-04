package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface CharSequenceValueInfo extends GenericValueInfo {

    @Override
    String value();

    @Override
    CharSequence charSequenceValue();

    @Override
    default boolean isText() {
        return true;
    }

    @Override
    default boolean isNull() {
        return charSequenceValue() == null;
    }

}
