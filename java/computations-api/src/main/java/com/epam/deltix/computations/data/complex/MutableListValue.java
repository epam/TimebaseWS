package com.epam.deltix.computations.data.complex;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.data.NullValue;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableListValueInfo;

import javax.annotation.Nonnull;
import java.util.Iterator;
import java.util.List;

public class MutableListValue implements MutableListValueInfo, Reusable {

    private final ObjectArrayList<GenericValueInfo> list = new ObjectArrayList<>();
    private ObjectArrayList<GenericValueInfo> value = null;

    @Override
    public GenericValueInfo get(int i) {
        return value == null ? NullValue.INSTANCE: value.get(i);
    }

    @Override
    public int size() {
        return list.size();
    }

    @Override
    public List<GenericValueInfo> value() {
        return value;
    }

    @Override
    public void reuse() {
        list.clear();
        value = null;
    }

    @Override
    public void setNull() {
        value = null;
    }

    @Override
    public void add(GenericValueInfo genericValue) {
        if (value == null) {
            value = list;
        }
        list.add(genericValue);
    }

    @Override
    public void clear() {
        list.clear();
    }

    @Nonnull
    @Override
    public Iterator<GenericValueInfo> iterator() {
        return value == null ? EMPTY: list.iterator();
    }

    private static final Iterator<GenericValueInfo> EMPTY = new Iterator<GenericValueInfo>() {
        @Override
        public boolean hasNext() {
            return false;
        }

        @Override
        public GenericValueInfo next() {
            return null;
        }
    };
}
