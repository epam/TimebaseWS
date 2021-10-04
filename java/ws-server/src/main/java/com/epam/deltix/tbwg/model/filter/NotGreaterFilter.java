package com.epam.deltix.tbwg.model.filter;

import com.epam.deltix.tbwg.utils.qql.SelectBuilder;

import java.util.List;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class NotGreaterFilter extends Filter {
    public NotGreaterFilter(String field, List<?> data) {
        super(field, data);
    }

    @Override
    public SelectBuilder appendTo(SelectBuilder selectBuilder) throws SelectBuilder.NoSuchFieldException,
            SelectBuilder.WrongTypeException {
        return selectBuilder.field(field).notGreaterThan(getFirstValue());
    }
}
