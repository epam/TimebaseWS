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

import org.agrona.collections.ObjectHashSet;

import java.util.Set;
import java.util.function.Function;

public class ObjectToObjectHashMap<K, V> extends com.epam.deltix.util.collections.generated.ObjectToObjectHashMap<K, V> {

    private final StringBuilder sb = new StringBuilder();

    public V computeIfAbsent(K key, Function<K, ? extends V> mappingFunction) {
        V value = get(key, null);
        if (value == null) {
            value = mappingFunction.apply(key);
            put(key, value);
        }
        return value;
    }

    public Set<K> keySet() {
        ObjectHashSet<K> set = new ObjectHashSet<>(size());
        keyIterator().forEachRemaining(set::add);
        return set;
    }

    @Override
    public String toString() {
        if (isEmpty()) {
            return "{}";
        }
        sb.setLength(0);
        sb.append("{");
        for (K key : keySet()) {
            sb.append(key).append(" : ").append(get(key, null)).append(", ");
        };
        sb.setLength(sb.length() - 2);
        sb.append("}");
        return sb.toString();
    }
}
