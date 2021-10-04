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
package com.epam.deltix.computations.data.base.numeric;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.GenericValueInfo;

public interface BooleanValueInfo extends GenericValueInfo {

    byte booleanValue();

    @Override
    default Boolean value() {
        return isNull() ? null: booleanValue() == 1;
    }

    @Override
    default boolean isNumeric() {
        return false;
    }

    @Override
    default byte byteValue() {
        return isNull() ? BYTE_NULL: booleanValue();
    }

    @Override
    default short shortValue() {
        return isNull() ? SHORT_NULL: booleanValue();
    }

    @Override
    default int intValue() {
        return isNull() ? INT_NULL: booleanValue();
    }

    @Override
    default long longValue() {
        return isNull() ? LONG_NULL: booleanValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: booleanValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: booleanValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromInt(booleanValue());
    }

    @Override
    default boolean isNull() {
        return booleanValue() == BOOLEAN_NULL;
    }

    @Override
    default CharSequence charSequenceValue() {
        return booleanValue() == BOOLEAN_NULL ? "NULL": (isTrue(this) ? "TRUE": "FALSE");
    }

    static boolean isTrue(BooleanValueInfo value) {
        return value.booleanValue() == 1;
    }

    static boolean isFalse(BooleanValueInfo value) {
        return value.booleanValue() == 0;
    }

}
