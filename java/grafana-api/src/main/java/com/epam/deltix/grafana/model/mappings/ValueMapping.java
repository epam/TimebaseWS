package com.epam.deltix.grafana.model.mappings;

import com.epam.deltix.grafana.model.fields.MappingType;

public abstract class ValueMapping {

    protected long id;
    protected String operator;
    protected String text;
    protected MappingType type;

    public ValueMapping(long id, String operator, String text, MappingType type) {
        this.id = id;
        this.operator = operator;
        this.text = text;
        this.type = type;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public MappingType getType() {
        return type;
    }

    public void setType(MappingType type) {
        this.type = type;
    }
}
