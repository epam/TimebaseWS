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
package com.epam.deltix.common.orderbook.options;

import java.io.Serializable;
import java.util.Objects;

/**
 * Option class
 *
 * @param <T> stored value.
 */
public class Optional<T> implements Serializable {

    /**
     * Common instance for {@code empty()}.
     */
    private static final Optional<?> EMPTY = new Optional<>();

    private final T val;

    private Optional(final T val) {
        if (val == null) {
            throw new IllegalArgumentException("Optional can not be null");
        }
        this.val = val;
    }

    private Optional() {
        this.val = null;
    }

    /**
     * Produce empty Option
     *
     * @param <T> type
     * @return empty option
     */
    public static <T> Optional<T> none() {
        @SuppressWarnings("unchecked")
        Optional<T> t = (Optional<T>) EMPTY;
        return t;
    }

    /**
     * Wrap the existing value in Option.
     *
     * @param val value to wrap
     * @param <T> type
     * @return option with value
     */
    public static <T> Optional<T> of(final T val) {
        return new Optional<>(val);
    }

    public static <T> Optional<T> eitherOf(final T val) {
        if (val == null) {
            return Optional.none();
        } else {
            return Optional.of(val);
        }
    }

    public T orElse(final T elseVal) {
        return (val == null) ? elseVal : val;
    }

    public Optional<T> orAnother(Optional<T> alternative) {
        return (val == null) ? alternative : this;
    }

    public boolean hasValue() {
        return val != null;
    }

    public String toString() {
        if (val == null) {
            return "[]";
        } else {
            return "[" + val + "]";
        }
    }

    public T get() {
        if (val == null) {
            throw new IllegalStateException("Optional is null");
        }
        return val;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        final Optional optional = (Optional) o;

        if (!Objects.equals(val, optional.val)) return false;

        return true;
    }

    @Override
    public int hashCode() {
        return val != null ? val.hashCode() : 0;
    }

}
