package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface NumberValueInfo extends GenericValueInfo {

    @Override
    Number value();

    @Override
    default boolean isNumeric() {
        return true;
    }

}
