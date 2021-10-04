package com.epam.deltix.computations.data.base;

public enum ValueType {
    LONG, INT, SHORT, BYTE,
    FLOAT, DOUBLE, DECIMAL64,
    BOOLEAN,
    ENUM, VARCHAR, CHAR,
    DATETIME, TIMEOFDAY,
    OBJECT, ARRAY,

    /**
     * The same as input type.
     */
    INPUT
}
