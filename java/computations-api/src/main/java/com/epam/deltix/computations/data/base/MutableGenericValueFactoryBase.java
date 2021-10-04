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

import com.epam.deltix.computations.data.base.complex.MutableBinaryValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableEnumValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableListValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableObjectValueInfo;
import com.epam.deltix.computations.data.base.numeric.*;
import com.epam.deltix.computations.data.base.text.MutableCharValueInfo;
import com.epam.deltix.computations.data.base.text.MutableAlphanumericValueInfo;
import com.epam.deltix.computations.data.base.text.MutableCharSequenceValueInfo;
import com.epam.deltix.computations.data.base.time.MutableTimeOfDayValueInfo;
import com.epam.deltix.computations.data.base.time.MutableTimestampValueInfo;

public interface MutableGenericValueFactoryBase extends GenericValueFactory {

    @Override
    MutableByteValueInfo byteValue(byte value);

    @Override
    MutableDecimalValueInfo decimalValue(long value);

    @Override
    MutableDoubleValueInfo doubleValue(double value);

    @Override
    MutableFloatValueInfo floatValue(float value);

    @Override
    MutableIntValueInfo intValue(int value);

    @Override
    MutableLongValueInfo longValue(long value);

    @Override
    MutableShortValueInfo shortValue(short value);

    @Override
    MutableAlphanumericValueInfo alphanumericValue(long value);

    @Override
    MutableCharValueInfo charValue(char value);

    @Override
    MutableBooleanValueInfo booleanValue(byte value);

    default MutableBooleanValueInfo booleanValue(boolean value) {
        return booleanValue((byte) (value ? 1: 0));
    }

    @Override
    MutableTimeOfDayValueInfo timeOfDayValue(int value);

    @Override
    MutableTimestampValueInfo timestampValue(long value);

    @Override
    MutableCharSequenceValueInfo charSequenceValue(CharSequence charSequence);

    default MutableCharSequenceValueInfo charSequenceValue() {
        return charSequenceValue(null);
    }

    @Override
    MutableEnumValueInfo enumValue();

    @Override
    MutableObjectValueInfo objectValue();

    @Override
    MutableListValueInfo listValue();

    @Override
    MutableBinaryValueInfo binaryValue();

    @Override
    MutableGenericValueInfo copy(GenericValueInfo value);

    default MutableByteValueInfo byteValue() {
        return byteValue(GenericValueInfo.BYTE_NULL);
    }

    default MutableDecimalValueInfo decimalValue() {
        return decimalValue(GenericValueInfo.DECIMAL_NULL);
    }

    default MutableDoubleValueInfo doubleValue() {
        return doubleValue(GenericValueInfo.DOUBLE_NULL);
    }

    default MutableFloatValueInfo floatValue() {
        return floatValue(GenericValueInfo.FLOAT_NULL);
    }

    default MutableIntValueInfo intValue() {
        return intValue(GenericValueInfo.INT_NULL);
    }

    default MutableLongValueInfo longValue() {
        return longValue(GenericValueInfo.LONG_NULL);
    }

    default MutableShortValueInfo shortValue() {
        return shortValue(GenericValueInfo.SHORT_NULL);
    }

    default MutableAlphanumericValueInfo alphanumericValue() {
        return alphanumericValue(GenericValueInfo.ALPHANUMERIC_NULL);
    }

    default MutableCharValueInfo charValue() {
        return charValue(GenericValueInfo.CHAR_NULL);
    }

    default MutableBooleanValueInfo booleanValue() {
        return booleanValue(false);
    }

    default MutableTimeOfDayValueInfo timeOfDayValue() {
        return timeOfDayValue(GenericValueInfo.TIME_OF_DAY_NULL);
    }

    default MutableTimestampValueInfo timestampValue() {
        return timestampValue(GenericValueInfo.TIMESTAMP_NULL);
    }
}
