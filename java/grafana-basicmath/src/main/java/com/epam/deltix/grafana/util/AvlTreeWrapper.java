package com.epam.deltix.grafana.util;

import com.epam.deltix.containers.AvlTree;

import java.util.HashSet;
import java.util.Set;

public class AvlTreeWrapper<K extends Comparable<K>> {

    private static final Object OBJECT = new Object();

    private final AvlTree<K, Object> avlTree = new AvlTree<>();
    private final Set<K> set = new HashSet<>();

    public void add(K key) {
        set.add(key);
        avlTree.add(key, OBJECT);
    }

    public K quantile(double quantile) {
        if (avlTree.isEmpty()) {
            return null;
        }
        int i = avlTree.getQuantileIterator(quantile);
        if (i == -1) {
            return null;
        }
        return avlTree.getKeyByIterator(i);
    }

    public void clear() {
        set.forEach(avlTree::remove);
        set.clear();
    }

}
