package com.epam.deltix.grafana.model.fields;

import com.fasterxml.jackson.annotation.JsonValue;

public enum FieldType {

    TIME("time"),
    NUMBER("number"),
    STRING("string"),
    BOOLEAN("boolean"),
    TRACE("trace"),
    OTHER("other");

    private final String value;

    FieldType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
