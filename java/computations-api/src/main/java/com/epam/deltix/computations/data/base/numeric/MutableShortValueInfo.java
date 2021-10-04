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

public interface MutableShortValueInfo extends ShortValueInfo, MutableGenericValueInfo {

    @Override
    void set(short value);

    @Override
    default void setNull() {
        set(GenericValueInfo.SHORT_NULL);
    }

    @Override
    default void set(byte value) {
        set((short) value);
    }

    @Override
    default void set(int value) {
        set((short) value);
    }

    @Override
    default void set(long value) {
        set((short) value);
    }
}
