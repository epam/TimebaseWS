package com.epam.deltix.computations.data.text;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.containers.MutableString;
import com.epam.deltix.util.annotations.Alphanumeric;

import com.epam.deltix.computations.data.base.text.MutableAlphanumericValueInfo;

public class MutableAlphanumericValue implements MutableAlphanumericValueInfo, Reusable {

    @Alphanumeric
    private long value;

    private MutableString sb = null;

    public MutableAlphanumericValue(@Alphanumeric long value) {
        this.value = value;
    }

    public MutableAlphanumericValue() {
        this.value = ALPHANUMERIC_NULL;
    }

    @Override
    public void reuse() {
        value = LONG_NULL;
        if (sb != null) {
            sb.clear();
        }
    }

    @Override
    @Alphanumeric
    public long alphanumericValue() {
        return value;
    }

    @Override
    public void setAlphanumeric(@Alphanumeric long value) {
        this.value = value;
    }

    @Override
    public CharSequence charSequenceValue() {
        if (value == ALPHANUMERIC_NULL) {
            return null;
        }

        if (sb == null)
            sb = new MutableString();

        return AlphanumericUtils.assignAlphanumeric(sb, value);
    }

    public static MutableAlphanumericValue of(CharSequence charSequence) {
        return new MutableAlphanumericValue(AlphanumericUtils.toAlphanumericUInt64(charSequence));
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + charSequenceValue();
    }
}
