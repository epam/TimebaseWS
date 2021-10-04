package com.epam.deltix.computations.data.text;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.containers.MutableString;
import com.epam.deltix.util.annotations.Alphanumeric;
import com.epam.deltix.computations.data.base.text.MutableCharSequenceValueInfo;

public class MutableCharSequenceValue implements MutableCharSequenceValueInfo {

    private final MutableString cache = new MutableString();

    private MutableString value;

    @Override
    public void reuse() {
        value = null;
    }

    @Override
    public String value() {
        return value.toString();
    }

    @Override
    public CharSequence charSequenceValue() {
        return value;
    }

    @Override
    public void set(CharSequence value) {
        if (value == null) {
            this.value = null;
        } else {
            cache.clear();
            cache.append(value);
            this.value = cache;
        }
    }

    @Override
    public void setAlphanumeric(@Alphanumeric long value) {
        if (value == ALPHANUMERIC_NULL) {
            this.value = null;
        } else {
            AlphanumericUtils.assignAlphanumeric(cache, value);
            this.value = cache;
        }
    }

    public static MutableCharSequenceValue of(CharSequence charSequence) {
        MutableCharSequenceValue charSequenceValue = new MutableCharSequenceValue();
        charSequenceValue.set(charSequence);
        return charSequenceValue;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
