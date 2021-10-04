/*
 * Copyright 2021 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
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