package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.containers.ObjObjPair;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.text.CharSequenceValueInfo;

import java.util.stream.Stream;
import java.util.stream.StreamSupport;

public interface ObjectValueInfo extends GenericValueInfo, Iterable<ObjObjPair<CharSequence, GenericValueInfo>> {

    String TYPE_KEY = "$type";

    @Override
    GenericValueInfo getValue(CharSequence key);

    @Override
    default boolean isNumeric() {
        return false;
    }

    @Override
    default boolean isNull() {
        return value() == null;
    }

    default CharSequenceValueInfo getType() {
        return (CharSequenceValueInfo) getValue(TYPE_KEY);
    }

    default Stream<ObjObjPair<CharSequence, GenericValueInfo>> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

}
