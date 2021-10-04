package com.epam.deltix.grafana.model.color;

import com.fasterxml.jackson.annotation.JsonValue;

public enum FieldColorMode {

    Thresholds("thresholds"),
    Scheme("scheme"),
    Fixed("fixed");

    private final String value;

    FieldColorMode(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
