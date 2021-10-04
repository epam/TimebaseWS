package com.epam.deltix.grafana.base.annotations;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(value = RetentionPolicy.RUNTIME)
public @interface FieldArgument {

    String name();

    GrafanaValueType[] types();

    String doc() default "";

}
