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
import com.epam.deltix.dfp.Decimal64;
import com.epam.deltix.dfp.Decimal64Utils;

public interface DecimalValueInfo extends NumberValueInfo {

    @Override
    @Decimal
    long decimalValue();

    @Decimal
    @Override
    default Decimal64 value() {
        return isNull() ? null: decimal64Value();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: (float) Decimal64Utils.toDouble(decimalValue());
    }

    @Override
    default double doubleValue() {
        return isNull() ? DOUBLE_NULL: Decimal64Utils.toDouble(decimalValue());
    }

    @Override
    default boolean isNull() {
        return decimalValue() == DECIMAL_NULL;
    }
}
