package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.computations.data.base.ArgumentType;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(value = RetentionPolicy.RUNTIME)
public @interface ConstantArgument {

    String name();

    ArgumentType type();

    String defaultValue();

    String min() default "";

    String max() default "";

    String doc() default "";

}
