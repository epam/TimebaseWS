package com.epam.deltix.grafana.base.annotations;

import com.epam.deltix.computations.data.base.ValueType;

public @interface ReturnField {

    ValueType value();

    String constantName() default "";

}
