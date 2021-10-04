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
package com.epam.deltix.computations.data.numeric;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.numeric.MutableDoubleValueInfo;

public class MutableDoubleValue implements MutableDoubleValueInfo, Reusable {

    private double value;

    public MutableDoubleValue() {
        this.value = DOUBLE_NULL;
    }

    public MutableDoubleValue(double value) {
        this.value = value;
    }

    @Override
    public double doubleValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = DOUBLE_NULL;
    }

    @Override
    public void set(double value) {
        this.value = value;
    }

    public static MutableDoubleValue of(double value) {
        return new MutableDoubleValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
