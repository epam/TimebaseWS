package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.util.buffer.Buffer;
import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface BinaryValueInfo extends GenericValueInfo {

    @Override
    Buffer binaryValue();

    @Override
    default Buffer value() {
        return binaryValue();
    }

    @Override
    default boolean isNumeric() {
        return false;
    }

    @Override
    default boolean isNull() {
        return binaryValue() == null;
    }

}
