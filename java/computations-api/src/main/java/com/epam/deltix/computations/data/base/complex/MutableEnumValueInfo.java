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
package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

public interface MutableEnumValueInfo extends EnumValueInfo, MutableGenericValueInfo {

    @Override
    void setEnum(CharSequence value, long ordinal);

    @Override
    default void set(CharSequence value) {
        setEnum(value, LONG_NULL);
    }

    @Override
    default void set(long value) {
        setEnum(null, value);
    }

    @Override
    default void setNull() {
        setEnum(null, LONG_NULL);
    }
}
