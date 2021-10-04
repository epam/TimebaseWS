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
