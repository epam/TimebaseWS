package com.epam.deltix.tbwg.model.filter;

import com.epam.deltix.tbwg.utils.qql.SelectBuilder;

import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public abstract class Filter {
    public Filter(String field, List<?> data) {
        this.field = field;
        this.data = data;
    }

    protected String field;
    protected List<?> data;

    public abstract SelectBuilder appendTo(SelectBuilder selectBuilder) throws SelectBuilder.NoSuchFieldException,
            SelectBuilder.WrongTypeException;

    protected List<String> getList() {
        return data.stream().map(o -> o == null ? null: o.toString()).collect(Collectors.toList());
    }

    protected String getFirstValue() {
        return data.get(0).toString();
    }

    protected String[] getTwo() {
        return new String[] {
                data.get(0).toString(),
                data.get(1).toString()
        };
    }

}
