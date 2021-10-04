package com.epam.deltix.grafana.model.fields;

import com.fasterxml.jackson.annotation.JsonValue;

public enum NullValueMode {

    Null("null"), Ignore("connected"), AsZero("null as zero");

    private final String value;

    NullValueMode(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
