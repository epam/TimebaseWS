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

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;

public interface MutableDecimalValueInfo extends DecimalValueInfo, MutableGenericValueInfo {

    @Override
    void setDecimal(@Decimal long value);

    @Override
    default void setNull() {
        setDecimal(GenericValueInfo.DECIMAL_NULL);
    }

    @Override
    default void set(byte value) {
        setDecimal(Decimal64Utils.fromInt(value));
    }

    @Override
    default void set(short value) {
        setDecimal(Decimal64Utils.fromInt(value));
    }

    @Override
    default void set(int value) {
        setDecimal(Decimal64Utils.fromInt(value));
    }

    @Override
    default void set(long value) {
        setDecimal(Decimal64Utils.fromLong(value));
    }

    @Override
    default void set(float value) {
        setDecimal(Decimal64Utils.fromDouble(value));
    }

    @Override
    default void set(double value) {
        setDecimal(Decimal64Utils.fromDouble(value));
    }
}
