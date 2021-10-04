package com.epam.deltix.computations.data.complex;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.complex.MutableEnumValueInfo;

public class MutableEnumValue implements MutableEnumValueInfo, Reusable {

    private final StringBuilder sb = new StringBuilder();
    private CharSequence value;
    private long ordinal = LONG_NULL;

    @Override
    public CharSequence charSequenceValue() {
        return value;
    }

    @Override
    public CharSequence value() {
        return value;
    }

    @Override
    public long longValue() {
        return ordinal;
    }

    @Override
    public void reuse() {
        sb.setLength(0);
        value = null;
    }

    @Override
    public void setEnum(CharSequence value, long ordinal) {
        if (value == null) {
            this.value = null;
        } else {
            sb.setLength(0);
            sb.append(value);
            this.value = sb;
        }
        this.ordinal = ordinal;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value() + "@" + longValue();
    }
}
