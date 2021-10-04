package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericValueFactoryBase;
import com.epam.deltix.computations.data.base.complex.*;
import com.epam.deltix.computations.data.base.numeric.*;
import com.epam.deltix.computations.data.base.text.AlphanumericValueInfo;
import com.epam.deltix.computations.data.base.text.CharSequenceValueInfo;
import com.epam.deltix.computations.data.base.text.CharValueInfo;
import com.epam.deltix.computations.data.base.text.MutableCharSequenceValueInfo;
import com.epam.deltix.computations.data.base.time.TimeOfDayValueInfo;
import com.epam.deltix.computations.data.base.time.TimestampValueInfo;
import com.epam.deltix.computations.data.complex.MutableBinaryValue;
import com.epam.deltix.computations.data.complex.MutableEnumValue;
import com.epam.deltix.computations.data.complex.MutableGenericObjectImpl;
import com.epam.deltix.computations.data.complex.MutableListValue;
import com.epam.deltix.computations.data.numeric.*;
import com.epam.deltix.computations.data.text.MutableAlphanumericValue;
import com.epam.deltix.computations.data.text.MutableCharSequenceValue;
import com.epam.deltix.computations.data.text.MutableCharValue;
import com.epam.deltix.computations.data.time.MutableTimeOfDayValue;
import com.epam.deltix.computations.data.time.MutableTimestampValue;
import com.epam.deltix.computations.utils.CachedFactory;
import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.computations.data.base.MutableGenericValueInfo;

import java.util.Arrays;
import java.util.List;

public final class MutableGenericValueFactory implements MutableGenericValueFactoryBase, Reusable {

    // numeric
    private final CachedFactory<MutableByteValue> byteValues = new CachedFactory<>(1, MutableByteValue::new);
    private final CachedFactory<MutableDecimalValue> decimalValues = new CachedFactory<>(1, MutableDecimalValue::new);
    private final CachedFactory<MutableDoubleValue> doubleValues = new CachedFactory<>(1, MutableDoubleValue::new);
    private final CachedFactory<MutableFloatValue> floatValues = new CachedFactory<>(1, MutableFloatValue::new);
    private final CachedFactory<MutableIntValue> intValues = new CachedFactory<>(1, MutableIntValue::new);
    private final CachedFactory<MutableLongValue> longValues = new CachedFactory<>(1, MutableLongValue::new);
    private final CachedFactory<MutableShortValue> shortValues = new CachedFactory<>(1, MutableShortValue::new);
    private final CachedFactory<MutableBooleanValue> booleanValues = new CachedFactory<>(1, MutableBooleanValue::new);

    // text
    private final CachedFactory<MutableAlphanumericValue> alphanumericValues = new CachedFactory<>(1, MutableAlphanumericValue::new);
    private final CachedFactory<MutableCharSequenceValue> charSequenceValues = new CachedFactory<>(1, MutableCharSequenceValue::new);
    private final CachedFactory<MutableCharValue> charValues = new CachedFactory<>(1, MutableCharValue::new);

    //time
    private final CachedFactory<MutableTimeOfDayValue> timeOfDayValues = new CachedFactory<>(1, MutableTimeOfDayValue::new);
    private final CachedFactory<MutableTimestampValue> timestampValues = new CachedFactory<>(1, MutableTimestampValue::new);

    private final CachedFactory<MutableGenericObjectImpl> objectValues = new CachedFactory<>(1, MutableGenericObjectImpl::new);
    private final CachedFactory<MutableEnumValue> enumValues = new CachedFactory<>(1, MutableEnumValue::new);
    private final CachedFactory<MutableListValue> listValues = new CachedFactory<>(1, MutableListValue::new);
    private final CachedFactory<MutableBinaryValue> binaryValues = new CachedFactory<>(1, MutableBinaryValue::new);

    private final List<CachedFactory<?>> factories = Arrays.asList(
            byteValues, decimalValues, doubleValues, floatValues, intValues, longValues, shortValues, booleanValues,
            alphanumericValues, charValues, charSequenceValues,
            timeOfDayValues, timestampValues,
            objectValues, enumValues, binaryValues, listValues);

    @Override
    public void reuse() {
        factories.forEach(CachedFactory::reuse);
    }

    @Override
    public MutableByteValue byteValue(byte value) {
        MutableByteValue mbv = byteValues.create();
        mbv.set(value);
        return mbv;
    }

    @Override
    public MutableDecimalValue decimalValue(long value) {
        MutableDecimalValue mdv = decimalValues.create();
        mdv.setDecimal(value);
        return mdv;
    }

    @Override
    public MutableDoubleValue doubleValue(double value) {
        MutableDoubleValue mdv = doubleValues.create();
        mdv.set(value);
        return mdv;
    }

    @Override
    public MutableFloatValue floatValue(float value) {
        MutableFloatValue mfv = floatValues.create();
        mfv.set(value);
        return mfv;
    }

    @Override
    public MutableIntValue intValue(int value) {
        MutableIntValue miv = intValues.create();
        miv.set(value);
        return miv;
    }

    @Override
    public MutableLongValue longValue(long value) {
        MutableLongValue mlv = longValues.create();
        mlv.set(value);
        return mlv;
    }

    @Override
    public MutableShortValue shortValue(short value) {
        MutableShortValue msv = shortValues.create();
        msv.set(value);
        return msv;
    }

    @Override
    public MutableAlphanumericValue alphanumericValue(long value) {
        MutableAlphanumericValue mav = alphanumericValues.create();
        mav.setAlphanumeric(value);
        return mav;
    }

    @Override
    public MutableCharValue charValue(char value) {
        MutableCharValue mcv = charValues.create();
        mcv.set(value);
        return mcv;
    }

    @Override
    public MutableBooleanValue booleanValue(byte value) {
        MutableBooleanValue mbv = booleanValues.create();
        mbv.set(value);
        return mbv;
    }

    @Override
    public MutableTimeOfDayValue timeOfDayValue(int value) {
        MutableTimeOfDayValue mtdv = timeOfDayValues.create();
        mtdv.setTimeOfDay(value);
        return mtdv;
    }

    @Override
    public MutableTimestampValue timestampValue(long value) {
        MutableTimestampValue mtv = timestampValues.create();
        mtv.setTimestamp(value);
        return mtv;
    }

    @Override
    public MutableCharSequenceValueInfo charSequenceValue(CharSequence charSequence) {
        MutableCharSequenceValueInfo charSequenceValueInfo = charSequenceValues.create();
        charSequenceValueInfo.set(charSequence);
        return charSequenceValueInfo;
    }

    @Override
    public MutableCharSequenceValue charSequenceValue() {
        return charSequenceValues.create();
    }

    @Override
    public MutableEnumValue enumValue() {
        return enumValues.create();
    }

    @Override
    public MutableGenericObjectImpl objectValue() {
        return objectValues.create();
    }

    @Override
    public MutableListValueInfo listValue() {
        return listValues.create();
    }

    @Override
    public MutableBinaryValueInfo binaryValue() {
        return binaryValues.create();
    }

//    @Override
//    public MutableByteValue byteValue() {
//        return byteValue(GenericValueInfo.BYTE_NULL);
//    }
//
//    @Override
//    public MutableDecimalValue decimalValue() {
//        return decimalValue(GenericValueInfo.DECIMAL_NULL);
//    }
//
//    @Override
//    public MutableDoubleValue doubleValue() {
//        return doubleValue(GenericValueInfo.DOUBLE_NULL);
//    }
//
//    @Override
//    public MutableFloatValue floatValue() {
//        return floatValue(GenericValueInfo.FLOAT_NULL);
//    }
//
//    @Override
//    public MutableIntValue intValue() {
//        return intValue(GenericValueInfo.INT_NULL);
//    }
//
//    @Override
//    public MutableLongValue longValue() {
//        return longValue(GenericValueInfo.LONG_NULL);
//    }
//
//    @Override
//    public MutableShortValue shortValue() {
//        return shortValue(GenericValueInfo.SHORT_NULL);
//    }
//
//    @Override
//    public MutableAlphanumericValue alphanumericValue() {
//        return alphanumericValue(GenericValueInfo.ALPHANUMERIC_NULL);
//    }
//
//    @Override
//    public MutableCharValue charValue() {
//        return charValue(GenericValueInfo.CHAR_NULL);
//    }
//
//    @Override
//    public MutableBooleanValue booleanValue() {
//        return booleanValue(GenericValueInfo.BOOLEAN_NULL);
//    }
//
//    @Override
//    public MutableTimeOfDayValue timeOfDayValue() {
//        return timeOfDayValue(GenericValueInfo.TIME_OF_DAY_NULL);
//    }
//
//    @Override
//    public MutableTimestampValue timestampValue() {
//        return timestampValue(GenericValueInfo.TIMESTAMP_NULL);
//    }

    @Override
    public MutableGenericValueInfo copy(GenericValueInfo value) {
        if (value instanceof BooleanValueInfo) {
            return booleanValue(value.booleanValue());
        } else if (value instanceof ByteValueInfo) {
            return byteValue(value.byteValue());
        } else if (value instanceof DecimalValueInfo) {
            return decimalValue(value.decimalValue());
        } else if (value instanceof DoubleValueInfo) {
            return doubleValue(value.doubleValue());
        } else if (value instanceof FloatValueInfo) {
            return floatValue(value.floatValue());
        } else if (value instanceof IntValueInfo) {
            return intValue(value.intValue());
        } else if (value instanceof LongValueInfo) {
            return longValue(value.longValue());
        } else if (value instanceof ShortValueInfo) {
            return shortValue(value.shortValue());
        } else if (value instanceof AlphanumericValueInfo) {
            return alphanumericValue(value.alphanumericValue());
        } else if (value instanceof CharSequenceValueInfo) {
            return charSequenceValue(value.charSequenceValue());
        } else if (value instanceof CharValueInfo) {
            return charValue(value.charValue());
        } else if (value instanceof TimeOfDayValueInfo) {
            return timeOfDayValue(value.timeOfDayValue());
        } else if (value instanceof TimestampValueInfo) {
            return timestampValue(value.timestampValue());
        } else if (value instanceof EnumValueInfo) {
            MutableEnumValueInfo enumValueInfo = enumValue();
            enumValueInfo.setEnum(value.charSequenceValue(), value.longValue());
            return enumValueInfo;
        } else if (value instanceof BinaryValueInfo) {
            MutableBinaryValueInfo binaryValueInfo = binaryValue();
            binaryValueInfo.setBinary(value.binaryValue());
            return binaryValueInfo;
        } else if (value instanceof ObjectValueInfo) {
            MutableObjectValueInfo objectValueInfo = objectValue();
            ((ObjectValueInfo) value).forEach(pair -> objectValueInfo.set(pair.getFirst(), copy(pair.getSecond())));
            return objectValueInfo;
        } else {
            throw new UnsupportedOperationException();
        }
    }

    public void copyContent(ObjectValueInfo from, MutableObjectValueInfo to) {
        from.forEach(pair -> to.set(pair.getFirst(), copy(pair.getSecond())));
    }
}
