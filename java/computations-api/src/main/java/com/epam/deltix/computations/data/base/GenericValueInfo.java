package com.epam.deltix.computations.data.base;

import com.epam.deltix.timebase.messages.TypeConstants;
import com.epam.deltix.util.annotations.Alphanumeric;
import com.epam.deltix.util.annotations.TimeOfDay;
import com.epam.deltix.util.buffer.Buffer;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.qsrv.hf.pub.md.*;
import jdk.jfr.Timestamp;

public interface GenericValueInfo {

    byte BYTE_NULL = IntegerDataType.INT8_NULL;
    short SHORT_NULL = IntegerDataType.INT16_NULL;
    int INT_NULL = IntegerDataType.INT32_NULL;
    long LONG_NULL = IntegerDataType.INT64_NULL;

    float FLOAT_NULL = FloatDataType.IEEE32_NULL;
    double DOUBLE_NULL = FloatDataType.IEEE64_NULL;
    long DECIMAL_NULL = Decimal64Utils.NULL;

    @Alphanumeric long ALPHANUMERIC_NULL = TypeConstants.ALPHANUMERIC_NULL;
    char CHAR_NULL = CharDataType.NULL;

    byte BOOLEAN_NULL = BooleanDataType.NULL;

    @TimeOfDay int TIME_OF_DAY_NULL = TimeOfDayDataType.NULL;
    @Timestamp long TIMESTAMP_NULL = DateTimeDataType.NULL;

    Object value();

    boolean isNull();

    // Numeric values

    default byte booleanValue() {
        throw new UnsupportedOperationException();
    }

    default byte byteValue() {
        throw new UnsupportedOperationException();
    }

    default short shortValue() {
        throw new UnsupportedOperationException();
    }

    default int intValue() {
        throw new UnsupportedOperationException();
    }

    default long longValue() {
        throw new UnsupportedOperationException();
    }

    default float floatValue() {
        throw new UnsupportedOperationException();
    }

    default double doubleValue() {
        throw new UnsupportedOperationException();
    }

    @Decimal
    default long decimalValue() {
        throw new UnsupportedOperationException();
    }

    default Decimal64 decimal64Value() {
        return Decimal64.fromUnderlying(decimalValue());
    }

    // Text values

    default char charValue() {
        throw new UnsupportedOperationException();
    }

    @Alphanumeric
    default long alphanumericValue() {
        throw new UnsupportedOperationException();
    }

    default CharSequence charSequenceValue() {
        throw new UnsupportedOperationException();
    }

    // Time values

    @TimeOfDay
    default int timeOfDayValue() {
        throw new UnsupportedOperationException();
    }

    @Timestamp
    default long timestampValue() {
        throw new UnsupportedOperationException();
    }

    // Object value

    default GenericValueInfo getValue(CharSequence key) {
        throw new UnsupportedOperationException();
    }

    // List value

    default GenericValueInfo get(int i) {
        throw new UnsupportedOperationException();
    }

    default int size() {
        throw new UnsupportedOperationException();
    }

    // Binary value

    default Buffer binaryValue() {
        throw new UnsupportedOperationException();
    }

    // Helpers

    default boolean isNumeric() {
        return false;
    }

    default boolean isText() {
        return false;
    }

    default boolean isNotNull() {
        return !isNull();
    }

    static boolean isNull(byte value) {
        return value == BYTE_NULL;
    }

    static boolean isNull(short value) {
        return value == SHORT_NULL;
    }

    static boolean isNull(int value) {
        return value == BYTE_NULL;
    }

    static boolean isNull(long value) {
        return value == BYTE_NULL;
    }

    static boolean isNull(float value) {
        return Float.isNaN(value);
    }

    static boolean isNull(double value) {
        return Double.isNaN(value);
    }

    static boolean isDecimalNull(@Decimal long value) {
        return DECIMAL_NULL == value;
    }

}
