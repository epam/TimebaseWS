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
