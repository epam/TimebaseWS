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

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;

public interface MutableArguments extends Arguments, Reusable {

    void setLong(String key, long value);

    void setInt(String key, int value);

    void setShort(String key, short value);

    void setByte(String key, byte value);

    void setFloat(String key, float value);

    void setDouble(String key, double value);

    void setDecimal(String key, @Decimal long value);

    void setBoolean(String key, boolean value);

    void setString(String key, String value);

    default void set(String key, String value, ArgumentType type) {
        switch (type) {
            case INT8:
                setByte(key, Byte.parseByte(value));
                break;
            case INT16:
                setShort(key, Short.parseShort(value));
                break;
            case INT32:
                setInt(key, Integer.parseInt(value));
                break;
            case INT64:
                setLong(key, Long.parseLong(value));
                break;
            case FLOAT32:
                setFloat(key, Float.parseFloat(value));
                break;
            case FLOAT64:
                setDouble(key, Double.parseDouble(value));
                break;
            case DECIMAL64:
                setDecimal(key, Decimal64Utils.parse(value));
                break;
            case BOOLEAN:
                setBoolean(key, Boolean.parseBoolean(value));
                break;
            case STRING:
                setString(key, value);
                break;
            default:
                throw new UnsupportedOperationException();
        }
    }

    default void setResult(String value) {
        setString(RESULT_FIELD_ARG, value);
    }

    default void setInterval(long value) {
        setLong(INTERVAL_ARG, value);
    }

    default void setStart(long value) {
        setLong(START_ARG, value);
    }

    default void setEnd(long value) {
        setLong(END_ARG, value);
    }

    default void setSymbol(String symbol) {
        setString(SYMBOL_ARG, symbol);
    }

}
