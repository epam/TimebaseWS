package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.grafana.model.fields.FieldType;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(value = RetentionPolicy.RUNTIME)
public @interface GrafanaField {

    String name();

    FieldType type();

}
