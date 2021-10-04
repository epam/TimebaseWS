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
package com.epam.deltix.computations.data.base;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.util.annotations.*;
import com.epam.deltix.util.buffer.Buffer;
import com.epam.deltix.dfp.Decimal;

public interface MutableGenericValueInfo extends GenericValueInfo, Reusable {

    void setNull();

    // Numeric values

    default void set(byte value) {
        throw new UnsupportedOperationException();
    }

    default void set(boolean value) {
        throw new UnsupportedOperationException();
    }

    default void set(short value) {
        throw new UnsupportedOperationException();
    }

    default void set(int value) {
        throw new UnsupportedOperationException();
    }

    default void set(long value) {
        throw new UnsupportedOperationException();
    }

    default void set(float value) {
        throw new UnsupportedOperationException();
    }

    default void set(double value) {
        throw new UnsupportedOperationException();
    }

    default void setDecimal(@Decimal long value) {
        throw new UnsupportedOperationException();
    }

    // Text values

    default void setAlphanumeric(@Alphanumeric long value) {
        throw new UnsupportedOperationException();
    }

    default void set(CharSequence value) {
        throw new UnsupportedOperationException();
    }

    default void set(char value) {
        throw new UnsupportedOperationException();
    }

    // Time values

    default void setTimeOfDay(@TimeOfDay int value) {
        throw new UnsupportedOperationException();
    }

    default void setTimestamp(@TimestampMs long value) {
        throw new UnsupportedOperationException();
    }

    // Enum value

    default void setEnum(CharSequence value, long ordinal) {
        throw new UnsupportedOperationException();
    }

    // Binary value

    default void setBinary(Buffer buffer) {
        throw new UnsupportedOperationException();
    }

    default void setBinary(byte[] bytes) {
        throw new UnsupportedOperationException();
    }

    // Object value

    default void set(CharSequence key, GenericValueInfo value) {
        throw new UnsupportedOperationException();
    }

    // List value

    default void add(GenericValueInfo genericValue) {
        throw new UnsupportedOperationException();
    }

    default void clear() {
        throw new UnsupportedOperationException();
    }

}
