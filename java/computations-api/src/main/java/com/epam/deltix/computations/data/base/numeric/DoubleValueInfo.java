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

public interface DoubleValueInfo extends NumberValueInfo {

    double doubleValue();

    @Override
    default Double value() {
        return isNull() ? null: doubleValue();
    }

    @Override
    default float floatValue() {
        return isNull() ? FLOAT_NULL: (float) doubleValue();
    }

    @Override
    default long decimalValue() {
        return isNull() ? DECIMAL_NULL: Decimal64Utils.fromDouble(doubleValue());
    }

    @Override
    default boolean isNull() {
        return Double.isNaN(doubleValue());
    }
}