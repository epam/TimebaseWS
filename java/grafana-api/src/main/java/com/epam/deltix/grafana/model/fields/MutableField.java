package com.epam.deltix.grafana.model.fields;

import javax.annotation.Nonnull;

public class MutableField implements Field {

    private String name;
    private FieldType fieldType = FieldType.OTHER;
    private final FieldConfig config;

    public MutableField() {
        this.config = new FieldConfig();
    }

    public MutableField(String name, FieldType fieldType) {
        this.name = name;
        this.fieldType = fieldType;
        this.config = new FieldConfig();
    }

    public MutableField(String name, FieldType fieldType, FieldConfig config) {
        this.name = name;
        this.fieldType = fieldType;
        this.config = config;
    }

    @Nonnull
    @Override
    public String name() {
        return name;
    }

    @Nonnull
    @Override
    public FieldType type() {
        return fieldType;
    }

    @Nonnull
    @Override
    public FieldConfig config() {
        return config;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setFieldType(FieldType fieldType) {
        this.fieldType = fieldType;
    }
}
