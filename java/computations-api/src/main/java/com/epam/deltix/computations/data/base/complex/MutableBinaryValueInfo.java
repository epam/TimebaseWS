package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

import java.nio.ByteBuffer;

public interface MutableBinaryValueInfo extends BinaryValueInfo, MutableGenericValueInfo {

    void setBinary(ByteBuffer buffer);

    void setBinary(byte[] bytes);

    @Override
    default void setNull() {
        setBinary((ByteBuffer) null);
    }
}
