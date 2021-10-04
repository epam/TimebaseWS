package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.util.buffer.Buffer;

public final class NullValue implements GenericValueInfo {

    public static final NullValue INSTANCE = new NullValue();

    private NullValue() {}

    @Override
    public Object value() {
        return null;
    }

    @Override
    public byte byteValue() {
        return BYTE_NULL;
    }

    @Override
    public short shortValue() {
        return SHORT_NULL;
    }

    @Override
    public int intValue() {
        return INT_NULL;
    }

    @Override
    public long longValue() {
        return LONG_NULL;
    }

    @Override
    public float floatValue() {
        return FLOAT_NULL;
    }

    @Override
    public double doubleValue() {
        return DOUBLE_NULL;
    }

    @Override
    public long decimalValue() {
        return DECIMAL_NULL;
    }

    @Override
    public char charValue() {
        return CHAR_NULL;
    }

    @Override
    public long alphanumericValue() {
        return LONG_NULL;
    }

    @Override
    public CharSequence charSequenceValue() {
        return null;
    }

    @Override
    public int timeOfDayValue() {
        return TIME_OF_DAY_NULL;
    }

    @Override
    public long timestampValue() {
        return TIMESTAMP_NULL;
    }

    @Override
    public GenericValueInfo getValue(CharSequence key) {
        return INSTANCE;
    }

    @Override
    public Buffer binaryValue() {
        return null;
    }

    @Override
    public byte booleanValue() {
        return BOOLEAN_NULL;
    }

    @Override
    public GenericValueInfo get(int i) {
        return INSTANCE;
    }

    @Override
    public int size() {
        return 0;
    }

    @Override
    public boolean isNumeric() {
        return true;
    }

    @Override
    public boolean isText() {
        return true;
    }

    @Override
    public boolean isNull() {
        return true;
    }

    @Override
    public boolean isNotNull() {
        return false;
    }
}
