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

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;

public interface ByteValueInfo extends NumberValueInfo {

    @Override
    byte byteValue();

    @Override
    default Byte value() {
        return isNull() ? null: byteValue();
    }

    @Override
    default short shortValue() {
        return isNull() ? SHORT_NULL: byteValue();
    }

    @Override
    default int intValue() {
        return isNull() ? INT_NULL: byteValue();
    }

    @Override
    default long longValue() {
        return isNull() ? LONG_NULL: byteValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: byteValue();
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: byteValue();
    }

    @Decimal
    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromInt(byteValue());
    }

    @Override
    default boolean isNull() {
        return byteValue() == BYTE_NULL;
    }
}
