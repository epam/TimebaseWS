package com.epam.deltix.tbwg.model.grafana.filters;

import com.epam.deltix.tbwg.model.filter.FilterType;

import java.util.List;

public class FieldFilter {

    protected FilterType filterType;
    protected String fieldName;
    protected List<String> values;

    public FilterType getFilterType() {
        return filterType;
    }

    public void setFilterType(FilterType filterType) {
        this.filterType = filterType;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public List<String> getValues() {
        return values;
    }

    public void setValues(List<String> values) {
        this.values = values;
    }
}
