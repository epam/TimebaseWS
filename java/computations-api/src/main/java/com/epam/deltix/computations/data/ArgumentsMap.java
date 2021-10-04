package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableArguments;
import com.epam.deltix.containers.generated.*;
import com.epam.deltix.util.lang.StringUtils;

public class ArgumentsMap implements MutableArguments {

    private final CharSequenceToLongHashMap longs = new CharSequenceToLongHashMap(GenericValueInfo.LONG_NULL);
    private final CharSequenceToIntHashMap ints = new CharSequenceToIntHashMap(GenericValueInfo.INT_NULL);
    private final CharSequenceToShortHashMap shorts = new CharSequenceToShortHashMap(GenericValueInfo.SHORT_NULL);
    private final CharSequenceToByteHashMap bytes = new CharSequenceToByteHashMap(GenericValueInfo.BYTE_NULL);

    private final CharSequenceToFloatHashMap floats = new CharSequenceToFloatHashMap(GenericValueInfo.FLOAT_NULL);
    private final CharSequenceToDoubleHashMap doubles = new CharSequenceToDoubleHashMap(GenericValueInfo.DOUBLE_NULL);
    private final CharSequenceToDecimalLongHashMap decimals = new CharSequenceToDecimalLongHashMap(GenericValueInfo.DECIMAL_NULL);

    private final CharSequenceToByteHashMap bools = new CharSequenceToByteHashMap((byte) -1);
    private final CharSequenceToObjHashMap<String> strings = new CharSequenceToObjHashMap<>(null);

    public ArgumentsMap() {}

    public ArgumentsMap(long start, long end, long interval, String symbol, String result) {
        setStart(start);
        setEnd(end);
        setInterval(interval);
        if (symbol != null) {
            setSymbol(symbol);
        }

        if (!StringUtils.isEmpty(result)) {
            setResult(result);
        }
    }

    @Override
    public long getLong(String key) {
        return longs.get(key);
    }

    @Override
    public long getLong(String key, long defaultValue) {
        long value = longs.get(key);
        return GenericValueInfo.isNull(value) ? defaultValue : value;
    }

    @Override
    public int getInt(String key) {
        return ints.get(key);
    }

    @Override
    public int getInt(String key, int defaultValue) {
        int value = ints.get(key);
        return GenericValueInfo.isNull(value) ? defaultValue : value;
    }

    @Override
    public short getShort(String key) {
        return shorts.get(key);
    }

    @Override
    public short getShort(String key, short defaultValue) {
        short value = shorts.get(key);
        return GenericValueInfo.isNull(value) ? defaultValue : value;
    }

    @Override
    public byte getByte(String key) {
        return bytes.get(key);
    }

    @Override
    public byte getByte(String key, byte defaultValue) {
        byte value = bytes.get(key);
        return GenericValueInfo.isNull(value) ? defaultValue : value;
    }

    @Override
    public float getFloat(String key) {
        return floats.get(key);
    }

    @Override
    public float getFloat(String key, float defaultValue) {
        long value = longs.get(key);
        return GenericValueInfo.isNull(value) ? defaultValue : value;
    }

    @Override
    public double getDouble(String key) {
        return doubles.get(key);
    }

    @Override
    public double getDouble(String key, double defaultValue) {
        double value = doubles.get(key);
        return GenericValueInfo.isNull(value) ? defaultValue : value;
    }

    @Override
    public long getDecimal(String key) {
        return decimals.get(key);
    }

    @Override
    public long getDecimal(String key, long defaultValue) {
        long value = longs.get(key);
        return GenericValueInfo.isDecimalNull(value) ? defaultValue : value;
    }

    @Override
    public boolean getBoolean(String key) {
        return bools.get(key) == 1;
    }

    @Override
    public boolean getBoolean(String key, boolean defaultValue) {
        byte value = bools.get(key);
        return value == -1 ? defaultValue : value == 1;
    }

    @Override
    public String getString(String key) {
        return strings.get(key);
    }

    @Override
    public String getString(String key, String defaultValue) {
        String value = strings.get(key);
        return value == null ? defaultValue: value;
    }

    @Override
    public void setLong(String key, long value) {
        longs.set(key, value);
    }

    @Override
    public void setInt(String key, int value) {
        ints.set(key, value);
    }

    @Override
    public void setShort(String key, short value) {
        shorts.set(key, value);
    }

    @Override
    public void setByte(String key, byte value) {
        bytes.set(key, value);
    }

    @Override
    public void setFloat(String key, float value) {
        floats.set(key, value);
    }

    @Override
    public void setDouble(String key, double value) {
        doubles.set(key, value);
    }

    @Override
    public void setDecimal(String key, long value) {
        decimals.set(key, value);
    }

    @Override
    public void setBoolean(String key, boolean value) {
        bools.set(key, (byte) (value ? 1 : 0));
    }

    @Override
    public void setString(String key, String value) {
        strings.set(key, value);
    }

    @Override
    public void reuse() {
        longs.clear();
        ints.clear();
        shorts.clear();
        bytes.clear();
        doubles.clear();
        floats.clear();
        decimals.clear();
        bools.clear();
        strings.clear();
    }
}
