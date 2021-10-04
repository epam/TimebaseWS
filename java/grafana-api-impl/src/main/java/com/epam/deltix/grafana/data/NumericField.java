package com.epam.deltix.grafana.data;

import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.grafana.model.fields.FieldConfig;
import com.epam.deltix.grafana.model.fields.FieldType;

import javax.annotation.Nonnull;

public class NumericField implements Field {

    private String name;
    private final FieldConfig fieldConfig;

    public NumericField() {
        this(null);
    }

    public NumericField(String name) {
        this(name, new FieldConfig());
    }

    public NumericField(String name, FieldConfig fieldConfig) {
        this.name = name;
        this.fieldConfig = fieldConfig;
    }

    @Nonnull
    @Override
    public String name() {
        return name;
    }

    @Nonnull
    @Override
    public FieldType type() {
        return FieldType.NUMBER;
    }

    @Nonnull
    @Override
    public FieldConfig config() {
        return fieldConfig;
    }

    public void setName(String name) {
        this.name = name;
    }
}
