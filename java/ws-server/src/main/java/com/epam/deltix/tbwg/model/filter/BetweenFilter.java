package com.epam.deltix.tbwg.model.filter;

import com.epam.deltix.tbwg.utils.qql.SelectBuilder;

import java.util.List;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class BetweenFilter extends Filter {
    public BetweenFilter(String field, List<?> data) {
        super(field, data);
    }

    @Override
    public SelectBuilder appendTo(SelectBuilder selectBuilder) throws SelectBuilder.NoSuchFieldException,
            SelectBuilder.WrongTypeException {
        String[] bounds = getTwo();
        return selectBuilder.field(field).between(bounds[0], bounds[1]);
    }
}
