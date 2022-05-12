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
package com.epam.deltix.computations.data.time;

import com.epam.deltix.computations.data.base.annotations.TimeOfDay;
import com.epam.deltix.computations.data.base.time.MutableTimeOfDayValueInfo;

public class MutableTimeOfDayValue implements MutableTimeOfDayValueInfo {

    @TimeOfDay
    private int value;

    public MutableTimeOfDayValue() {
        this.value = TIME_OF_DAY_NULL;
    }

    public MutableTimeOfDayValue(@TimeOfDay int value) {
        this.value = value;
    }

    @TimeOfDay
    @Override
    public int timeOfDayValue() {
        return value;
    }

    @Override
    public void reuse() {
        value = TIME_OF_DAY_NULL;
    }

    @Override
    public void setTimeOfDay(@TimeOfDay int value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + ":" + value();
    }
}
