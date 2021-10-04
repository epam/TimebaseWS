package com.epam.deltix.tbwg.model.filter;

import com.epam.deltix.tbwg.model.input.RawFilter;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class FilterFactory {

    public static Filter createFilter(String field, RawFilter rawFilter) {
        switch (rawFilter.type) {
            case EQUAL:
                return new EqualFilter(field, rawFilter.data);
            case NOTEQUAL:
                return new NotEqualFilter(field, rawFilter.data);
            case GREATER:
                return new GreaterFilter(field, rawFilter.data);
            case NOTGREATER:
                return new NotGreaterFilter(field, rawFilter.data);
            case LESS:
                return new LessFilter(field, rawFilter.data);
            case NOTLESS:
                return new NotLessFilter(field, rawFilter.data);
            case BETWEEN:
                return new BetweenFilter(field, rawFilter.data);
            case NULL:
                return new NullFilter(field);
            case NOTNULL:
                return new NotNullFilter(field);
            default:
                throw new UnsupportedOperationException();
        }
    }

}
