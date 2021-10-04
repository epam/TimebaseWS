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
package com.epam.deltix.computations.data.base;

import com.epam.deltix.dfp.Decimal;

public interface Arguments {

    String INTERVAL_ARG = "@interval";
    String START_ARG = "@start";
    String END_ARG = "@end";
    String RESULT_FIELD_ARG = "@resultField";
    String SYMBOL_ARG = "@symbol";

    long getLong(String key);

    long getLong(String key, long defaultValue);

    int getInt(String key);

    int getInt(String key, int defaultValue);

    short getShort(String key);

    short getShort(String key, short defaultValue);

    byte getByte(String key);

    byte getByte(String key, byte defaultValue);

    float getFloat(String key);

    float getFloat(String key, float defaultValue);

    double getDouble(String key);

    double getDouble(String key, double defaultValue);

    @Decimal
    long getDecimal(String key);

    @Decimal
    long getDecimal(String key, @Decimal long defaultValue);

    boolean getBoolean(String key);

    boolean getBoolean(String key, boolean defaultValue);

    String getString(String key);

    String getString(String key, String defaultValue);

    default long getInterval() {
        return getLong(INTERVAL_ARG);
    }

    default long getStart() {
        return getLong(START_ARG);
    }

    default long getEnd() {
        return getLong(END_ARG);
    }

    default String getResultField() {
        return getString(RESULT_FIELD_ARG);
    }

    default String getSymbol() {
        return getString(SYMBOL_ARG);
    }

}
