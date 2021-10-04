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
package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.util.buffer.Buffer;

public final class NullValue implements GenericValueInfo {

    public static final NullValue INSTANCE = new NullValue();

    private NullValue() {}

    @Override
    public Object value() {
        return null;
    }

    @Override
    public byte byteValue() {
        return BYTE_NULL;
    }

    @Override
    public short shortValue() {
        return SHORT_NULL;
    }

    @Override
    public int intValue() {
        return INT_NULL;
    }

    @Override
    public long longValue() {
        return LONG_NULL;
    }

    @Override
    public float floatValue() {
        return FLOAT_NULL;
    }

    @Override
    public double doubleValue() {
        return DOUBLE_NULL;
    }

    @Override
    public long decimalValue() {
        return DECIMAL_NULL;
    }

    @Override
    public char charValue() {
        return CHAR_NULL;
    }

    @Override
    public long alphanumericValue() {
        return LONG_NULL;
    }

    @Override
    public CharSequence charSequenceValue() {
        return null;
    }

    @Override
    public int timeOfDayValue() {
        return TIME_OF_DAY_NULL;
    }

    @Override
    public long timestampValue() {
        return TIMESTAMP_NULL;
    }

    @Override
    public GenericValueInfo getValue(CharSequence key) {
        return INSTANCE;
    }

    @Override
    public Buffer binaryValue() {
        return null;
    }

    @Override
    public byte booleanValue() {
        return BOOLEAN_NULL;
    }

    @Override
    public GenericValueInfo get(int i) {
        return INSTANCE;
    }

    @Override
    public int size() {
        return 0;
    }

    @Override
    public boolean isNumeric() {
        return true;
    }

    @Override
    public boolean isText() {
        return true;
    }

    @Override
    public boolean isNull() {
        return true;
    }

    @Override
    public boolean isNotNull() {
        return false;
    }
}
