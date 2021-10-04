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
package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.util.lang.StringUtils;
import com.epam.deltix.computations.data.base.ArgumentType;

import java.util.function.Predicate;

public class AnnotationUtil {

    private static final Predicate<String> TRUE = x -> true;

    public static Predicate<String> create(ConstantArgument argument) {
        if (argument.type() == ArgumentType.STRING || argument.type() == ArgumentType.BOOLEAN) {
            return TRUE;
        }
        boolean min = !StringUtils.isEmpty(argument.min());
        boolean max = !StringUtils.isEmpty(argument.max());

        if (min && max) {
            return createMinMax(argument);
        } else if (min) {
            return createMin(argument);
        } else if (max) {
            return createMax(argument);
        } else {
            return TRUE;
        }
    }

    private static Predicate<String> createMinMax(ConstantArgument argument) {
        switch (argument.type()) {
            case INT8:
                return x -> {
                    byte value = Byte.parseByte(x);
                    return value >= Byte.parseByte(argument.min()) && value <= Byte.parseByte(argument.max());
                };
            case INT16:
                return x -> {
                    short value = Short.parseShort(x);
                    return value >= Short.parseShort(argument.min()) && value <= Short.parseShort(argument.max());
                };
            case INT32:
                return x -> {
                    int value = Integer.parseInt(x);
                    return value >= Integer.parseInt(argument.min()) && value <= Integer.parseInt(argument.max());
                };
            case INT64:
                return x -> {
                    long value = Long.parseLong(x);
                    return value >= Long.parseLong(argument.min()) && value <= Long.parseLong(argument.max());
                };
            case FLOAT32:
                return x -> {
                    float value = Float.parseFloat(x);
                    return value >= Float.parseFloat(argument.min()) && value <= Float.parseFloat(argument.max());
                };
            case FLOAT64:
                return x -> {
                    double value = Double.parseDouble(x);
                    return value >= Double.parseDouble(argument.min()) && value <= Double.parseDouble(argument.max());
                };
            case DECIMAL64:
                return x -> {
                    @Decimal long value = Decimal64Utils.parse(x);
                    return Decimal64Utils.isGreaterOrEqual(value, Decimal64Utils.parse(argument.min()))
                            && Decimal64Utils.isLessOrEqual(value, Decimal64Utils.parse(argument.max()));
                };
            default:
                throw new UnsupportedOperationException();
        }
    }

    private static Predicate<String> createMin(ConstantArgument argument) {
        switch (argument.type()) {
            case INT8:
                return x -> {
                    byte value = Byte.parseByte(x);
                    return value >= Byte.parseByte(argument.min());
                };
            case INT16:
                return x -> {
                    short value = Short.parseShort(x);
                    return value >= Short.parseShort(argument.min());
                };
            case INT32:
                return x -> {
                    int value = Integer.parseInt(x);
                    return value >= Integer.parseInt(argument.min());
                };
            case INT64:
                return x -> {
                    long value = Long.parseLong(x);
                    return value >= Long.parseLong(argument.min());
                };
            case FLOAT32:
                return x -> {
                    float value = Float.parseFloat(x);
                    return value >= Float.parseFloat(argument.min());
                };
            case FLOAT64:
                return x -> {
                    double value = Double.parseDouble(x);
                    return value >= Double.parseDouble(argument.min());
                };
            case DECIMAL64:
                return x -> {
                    @Decimal long value = Decimal64Utils.parse(x);
                    return Decimal64Utils.isGreaterOrEqual(value, Decimal64Utils.parse(argument.min()));
                };
            default:
                throw new UnsupportedOperationException();
        }
    }

    private static Predicate<String> createMax(ConstantArgument argument) {
        switch (argument.type()) {
            case INT8:
                return x -> {
                    byte value = Byte.parseByte(x);
                    return value <= Byte.parseByte(argument.max());
                };
            case INT16:
                return x -> {
                    short value = Short.parseShort(x);
                    return value <= Short.parseShort(argument.max());
                };
            case INT32:
                return x -> {
                    int value = Integer.parseInt(x);
                    return value <= Integer.parseInt(argument.max());
                };
            case INT64:
                return x -> {
                    long value = Long.parseLong(x);
                    return value <= Long.parseLong(argument.max());
                };
            case FLOAT32:
                return x -> {
                    float value = Float.parseFloat(x);
                    return value <= Float.parseFloat(argument.max());
                };
            case FLOAT64:
                return x -> {
                    double value = Double.parseDouble(x);
                    return value <= Double.parseDouble(argument.max());
                };
            case DECIMAL64:
                return x -> {
                    @Decimal long value = Decimal64Utils.parse(x);
                    return Decimal64Utils.isLessOrEqual(value, Decimal64Utils.parse(argument.max()));
                };
            default:
                throw new UnsupportedOperationException();
        }
    }

}
