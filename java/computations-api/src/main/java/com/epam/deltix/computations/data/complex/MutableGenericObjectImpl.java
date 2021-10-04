package com.epam.deltix.computations.data.complex;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.containers.ObjObjPair;
import com.epam.deltix.containers.generated.CharSequenceToObjHashMap;
import com.epam.deltix.computations.data.NullValue;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableObjectValueInfo;

import javax.annotation.Nonnull;
import java.util.Iterator;
import java.util.stream.Collectors;

public class MutableGenericObjectImpl implements MutableObjectValueInfo, Reusable {

    protected final CharSequenceToObjHashMap<GenericValueInfo> values = new CharSequenceToObjHashMap<>(NullValue.INSTANCE);

    protected CharSequenceToObjHashMap<GenericValueInfo> map = null;

    @Override
    public CharSequenceToObjHashMap<GenericValueInfo> value() {
        return map;
    }

    @Override
    public GenericValueInfo getValue(CharSequence key) {
        return map == null ? NullValue.INSTANCE : map.get(key);
    }

    @Override
    public void set(CharSequence key, GenericValueInfo value) {
        if (map == null) {
            map = values;
        }
        values.set(key, value);
    }

    @Override
    public void setNull() {
        map = null;
    }

    @Override
    public void reuse() {
        values.clear();
        map = null;
    }

    @Nonnull
    @Override
    public Iterator<ObjObjPair<CharSequence, GenericValueInfo>> iterator() {
        return values.iterator();
    }

    @Override
    public String toString() {
        return "{" + stream().map(pair -> "\"" + pair.getFirst() + "\":" + pair.getSecond().toString())
                .collect(Collectors.joining(",")) +
                "}";
    }
}
