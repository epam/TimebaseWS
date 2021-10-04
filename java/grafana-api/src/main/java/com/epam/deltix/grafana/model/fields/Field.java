package com.epam.deltix.grafana.model.fields;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.annotation.Nonnull;

public interface Field {

    @JsonProperty
    @Nonnull
    String name();

    @JsonProperty
    @Nonnull
    FieldType type();

    @JsonProperty
    @Nonnull
    FieldConfig config();

}
