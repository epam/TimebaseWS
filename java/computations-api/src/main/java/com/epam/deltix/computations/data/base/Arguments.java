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
