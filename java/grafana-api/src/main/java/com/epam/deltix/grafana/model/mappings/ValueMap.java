package com.epam.deltix.grafana.model.mappings;

import com.epam.deltix.grafana.model.fields.MappingType;

public class ValueMap extends ValueMapping {

    protected String value;

    public ValueMap(long id, String operator, String text, String value) {
        super(id, operator, text, MappingType.ValueToText);
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
