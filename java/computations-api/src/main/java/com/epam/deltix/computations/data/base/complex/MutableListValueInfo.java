package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableListValueInfo extends ListValueInfo, MutableGenericValueInfo {

    @Override
    void add(GenericValueInfo genericValue);

    @Override
    void clear();

}
