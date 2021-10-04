package com.epam.deltix.grafana.base.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(value = ElementType.TYPE)
@Retention(value = RetentionPolicy.RUNTIME)
public @interface GrafanaFunction {

    String name();

    String group() default "";

    FieldArgument[] fieldArguments() default {};

    ConstantArgument[] constantArguments() default {};

    ReturnField[] returnFields() default {};

    boolean symbolRequired() default false;

    String doc() default "";

}
