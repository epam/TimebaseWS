package com.epam.deltix.computations.data.complex;

import com.epam.deltix.util.buffer.Buffer;
import com.epam.deltix.util.buffer.MutableBuffer;
import com.epam.deltix.util.buffer.UnsafeBuffer;
import com.epam.deltix.computations.data.base.complex.MutableBinaryValueInfo;

import java.nio.ByteBuffer;

public class MutableBinaryValue implements MutableBinaryValueInfo {

    private final MutableBuffer byteBuffer = UnsafeBuffer.allocateHeap(16);

    private MutableBuffer value;

    @Override
    public void setBinary(ByteBuffer buffer) {
        if (buffer == null) {
            value = null;
        } else {
            byteBuffer.wrap(buffer);
            value = byteBuffer;
        }
    }

    @Override
    public void setBinary(byte[] bytes) {
        if (bytes == null) {
            value = null;
        } else {
            byteBuffer.wrap(bytes);
            value = byteBuffer;
        }
    }

    @Override
    public Buffer binaryValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = null;
    }
}
