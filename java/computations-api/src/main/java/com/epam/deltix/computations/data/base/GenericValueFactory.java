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

import com.epam.deltix.computations.data.base.complex.BinaryValueInfo;
import com.epam.deltix.computations.data.base.complex.EnumValueInfo;
import com.epam.deltix.computations.data.base.complex.ListValueInfo;
import com.epam.deltix.computations.data.base.complex.ObjectValueInfo;
import com.epam.deltix.computations.data.base.numeric.*;
import com.epam.deltix.computations.data.base.text.AlphanumericValueInfo;
import com.epam.deltix.computations.data.base.text.CharSequenceValueInfo;
import com.epam.deltix.computations.data.base.text.CharValueInfo;
import com.epam.deltix.computations.data.base.time.TimeOfDayValueInfo;
import com.epam.deltix.computations.data.base.time.TimestampValueInfo;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.util.annotations.Alphanumeric;

public interface GenericValueFactory {

    ByteValueInfo byteValue(byte value);

    DecimalValueInfo decimalValue(@Decimal long value);

    DoubleValueInfo doubleValue(double value);

    FloatValueInfo floatValue(float value);

    IntValueInfo intValue(int value);

    LongValueInfo longValue(long value);

    ShortValueInfo shortValue(short value);

    AlphanumericValueInfo alphanumericValue(@Alphanumeric long value);

    CharValueInfo charValue(char value);

    BooleanValueInfo booleanValue(byte value);

    BooleanValueInfo booleanValue(boolean value);

    TimeOfDayValueInfo timeOfDayValue(int value);

    TimestampValueInfo timestampValue(long value);

    CharSequenceValueInfo charSequenceValue(CharSequence charSequence);

    CharSequenceValueInfo charSequenceValue();

    EnumValueInfo enumValue();

    ObjectValueInfo objectValue();

    ListValueInfo listValue();

    BinaryValueInfo binaryValue();

    GenericValueInfo copy(GenericValueInfo value);

    default ByteValueInfo byteValue() {
        return byteValue(GenericValueInfo.BYTE_NULL);
    }

    default DecimalValueInfo decimalValue() {
        return decimalValue(GenericValueInfo.DECIMAL_NULL);
    }

    default DoubleValueInfo doubleValue() {
        return doubleValue(GenericValueInfo.DOUBLE_NULL);
    }

    default FloatValueInfo floatValue() {
        return floatValue(GenericValueInfo.FLOAT_NULL);
    }

    default IntValueInfo intValue() {
        return intValue(GenericValueInfo.INT_NULL);
    }

    default LongValueInfo longValue() {
        return longValue(GenericValueInfo.LONG_NULL);
    }

    default ShortValueInfo shortValue() {
        return shortValue(GenericValueInfo.SHORT_NULL);
    }

    default AlphanumericValueInfo alphanumericValue() {
        return alphanumericValue(GenericValueInfo.LONG_NULL);
    }

    default CharValueInfo charValue() {
        return charValue(GenericValueInfo.CHAR_NULL);
    }

    default BooleanValueInfo booleanValue() {
        return booleanValue(false);
    }

    default TimeOfDayValueInfo timeOfDayValue() {
        return timeOfDayValue(GenericValueInfo.TIME_OF_DAY_NULL);
    }

    default TimestampValueInfo timestampValue() {
        return timestampValue(GenericValueInfo.TIMESTAMP_NULL);
    }

}
