package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.computations.data.base.ValueType;

public enum GrafanaValueType {
    LONG(ValueType.LONG),
    INT(ValueType.INT),
    SHORT(ValueType.SHORT),
    BYTE(ValueType.BYTE),
    FLOAT(ValueType.FLOAT),
    DOUBLE(ValueType.DOUBLE),
    DECIMAL64(ValueType.DECIMAL64),
    BOOLEAN(ValueType.BOOLEAN),
    ENUM(ValueType.ENUM),
    VARCHAR(ValueType.VARCHAR),
    CHAR(ValueType.CHAR),
    DATETIME(ValueType.DATETIME),
    TIMEOFDAY(ValueType.TIMEOFDAY),
    OBJECT(ValueType.OBJECT),
    ARRAY(ValueType.ARRAY),
    NUMERIC(ValueType.LONG, ValueType.INT, ValueType.SHORT, ValueType.BYTE, ValueType.FLOAT, ValueType.DOUBLE, ValueType.DECIMAL64),
    ANY(ValueType.values());

    private final ValueType[] types;

    GrafanaValueType(final ValueType ... types) {
        this.types = types;
    }

    public ValueType[] getTypes() {
        return types;
    }
}
