/*
 * Copyright 2021 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
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
