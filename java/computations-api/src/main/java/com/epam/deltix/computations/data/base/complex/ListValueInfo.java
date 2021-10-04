package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface ListValueInfo extends GenericValueInfo, Iterable<GenericValueInfo> {

    @Override
    GenericValueInfo get(int i);

    @Override
    int size();

    @Override
    Iterable<GenericValueInfo> value();

    @Override
    default boolean isNull() {
        return value() == null;
    }

}
