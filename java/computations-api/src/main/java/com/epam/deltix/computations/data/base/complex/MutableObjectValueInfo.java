package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;
import com.epam.deltix.computations.data.base.text.CharSequenceValueInfo;

public interface MutableObjectValueInfo extends ObjectValueInfo, MutableGenericValueInfo {

    @Override
    void set(CharSequence key, GenericValueInfo value);

    default void setType(CharSequenceValueInfo type) {
        set(TYPE_KEY, type);
    }

}
