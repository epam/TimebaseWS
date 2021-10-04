package com.epam.deltix.computations.utils;

import com.epam.deltix.util.lang.Factory;

import java.util.Arrays;

public final class CachedFactory<T> implements Factory<T>, Reusable {

    private final Factory<T> factory;

    private Object[] cache;
    private int index;

    public CachedFactory(Factory<T> factory) {
        this(32, factory);
    }

    public CachedFactory(int initialCapacity, Factory<T> factory) {
        Object[] cache = new Object[initialCapacity];
        for (int i = 0; i < cache.length; i++) {
            cache[i] = factory.create();
        }

        this.factory = factory;
        this.cache = cache;
    }

    @Override
    @SuppressWarnings("unchecked")
    public T create() {
        int length = cache.length;

        if (index == length) {
            cache = Arrays.copyOf(cache, length << 1);

            for (int i = length; i < cache.length; i++) {
                cache[i] = factory.create();
            }
        }

        return (T) cache[index++];
    }

    @Override
    public void reuse() {
        index = 0;
    }

}