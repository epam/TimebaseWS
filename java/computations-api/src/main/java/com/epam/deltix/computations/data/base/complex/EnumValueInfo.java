package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface EnumValueInfo extends GenericValueInfo {

    @Override
    CharSequence charSequenceValue();

    @Override
    CharSequence value();

    /**
     * Enum ordinal.
     * @return ordinal value.
     */
    @Override
    long longValue();

    @Override
    default boolean isNumeric() {
        return false;
    }

    @Override
    default boolean isNull() {
        return charSequenceValue() == null;
    }

}
