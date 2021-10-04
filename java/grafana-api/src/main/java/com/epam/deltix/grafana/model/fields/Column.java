package com.epam.deltix.grafana.model.fields;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.List;
import java.util.Map;

public interface Column extends Field {

    @JsonProperty
    @Nonnull
    List<Object> values();

    @JsonProperty
    @Nullable
    Map<String, String> labels();

}
