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
import com.epam.deltix.computations.data.base.numeric.MutableFloatValueInfo;

public class MutableFloatValue implements MutableFloatValueInfo, Reusable {

    private float value;

    public MutableFloatValue(float value) {
        this.value = value;
    }

    public MutableFloatValue() {
        this.value = FLOAT_NULL;
    }

    @Override
    public float floatValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = FLOAT_NULL;
    }

    @Override
    public void set(float value) {
        this.value = value;
    }

    public static MutableFloatValue of(float value) {
        return new MutableFloatValue(value);
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
