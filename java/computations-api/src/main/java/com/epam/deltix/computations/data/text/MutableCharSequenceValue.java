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
package com.epam.deltix.computations.data.text;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.containers.MutableString;
import com.epam.deltix.util.annotations.Alphanumeric;
import com.epam.deltix.computations.data.base.text.MutableCharSequenceValueInfo;

public class MutableCharSequenceValue implements MutableCharSequenceValueInfo {

    private final MutableString cache = new MutableString();

    private MutableString value;

    @Override
    public void reuse() {
        value = null;
    }

    @Override
    public String value() {
        return value.toString();
    }

    @Override
    public CharSequence charSequenceValue() {
        return value;
    }

    @Override
    public void set(CharSequence value) {
        if (value == null) {
            this.value = null;
        } else {
            cache.clear();
            cache.append(value);
            this.value = cache;
        }
    }

    @Override
    public void setAlphanumeric(@Alphanumeric long value) {
        if (value == ALPHANUMERIC_NULL) {
            this.value = null;
        } else {
            AlphanumericUtils.assignAlphanumeric(cache, value);
            this.value = cache;
        }
    }

    public static MutableCharSequenceValue of(CharSequence charSequence) {
        MutableCharSequenceValue charSequenceValue = new MutableCharSequenceValue();
        charSequenceValue.set(charSequence);
        return charSequenceValue;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
