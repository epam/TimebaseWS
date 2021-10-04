package com.epam.deltix.grafana.model.thresholds;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ThresholdsMode {

    Absolute("absolute"),
    Percentage("percentage");

    private final String value;

    ThresholdsMode(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
