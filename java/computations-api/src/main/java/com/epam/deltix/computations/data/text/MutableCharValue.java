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

import com.epam.deltix.computations.data.base.text.MutableCharValueInfo;

public class MutableCharValue implements MutableCharValueInfo {

    private char value;

    public MutableCharValue(char value) {
        this.value = value;
    }

    public MutableCharValue() {
        this(CHAR_NULL);
    }

    @Override
    public void reuse() {
        value = CHAR_NULL;
    }

    @Override
    public char charValue() {
        return value;
    }

    @Override
    public void set(char value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
