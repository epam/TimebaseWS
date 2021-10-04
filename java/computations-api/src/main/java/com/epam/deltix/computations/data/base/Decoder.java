package com.epam.deltix.computations.data.base;

public interface Decoder<T> {

    void decode(T object, MutableGenericRecord record);

}
