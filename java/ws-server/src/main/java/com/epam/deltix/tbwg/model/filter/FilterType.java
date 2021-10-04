package com.epam.deltix.tbwg.model.filter;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/25/2019
 */
public enum FilterType {
    EQUAL, NOTEQUAL, IN, NOT_IN,
    GREATER, NOTGREATER, LESS, NOTLESS, BETWEEN,
    NULL, NOTNULL,
    STARTS_WITH, ENDS_WITH, CONTAINS, NOT_CONTAINS,
}
