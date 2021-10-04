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
import com.epam.deltix.computations.data.base.numeric.MutableBooleanValueInfo;

public class MutableBooleanValue implements MutableBooleanValueInfo, Reusable {

    private byte value;

    public MutableBooleanValue(byte value) {
        this.value = value;
    }

    public MutableBooleanValue() {
        this(BOOLEAN_NULL);
    }

    @Override
    public void reuse() {
        value = BOOLEAN_NULL;
    }

    @Override
    public byte booleanValue() {
        return value;
    }

    public void set(byte value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
