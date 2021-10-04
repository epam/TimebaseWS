package com.epam.deltix.grafana.model;

import com.epam.deltix.grafana.model.fields.Column;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.Collection;

public interface DataFrame {

    @JsonProperty
    @Nullable
    String getName();

    @JsonProperty
    @Nonnull
    Collection<Column> getFields();

    @JsonProperty
    int getLength();

}
