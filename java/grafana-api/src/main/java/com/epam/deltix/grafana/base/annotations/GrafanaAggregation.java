package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.grafana.base.Aggregation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation, that marks class as Grafana aggregation.
 * Class must implement {@link Aggregation} interface.
 */
@Target(value = ElementType.TYPE)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface GrafanaAggregation {

    /**
     * Unique (in module) display name for UI.
     *
     * @return short name
     */
    String name();

    /**
     * Module name for UI.
     *
     * @return module name
     */
    String group() default "";

    FieldArgument[] fieldArguments() default {};

    ConstantArgument[] constantArguments() default {};

    ReturnField[] returnFields() default {};

    boolean symbolRequired() default false;

    String doc() default "";

}
