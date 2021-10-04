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
package com.epam.deltix.tbwg.model.input;

import javax.validation.Constraint;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.Payload;
import java.lang.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class Filters implements ConstraintValidator<FiltersConstraint, Map<String, List<RawFilter>>> {

    @Override
    public void initialize(FiltersConstraint constraintAnnotation) {
    }

    @Override
    public boolean isValid(Map<String, List<RawFilter>> map, ConstraintValidatorContext context) {
        for (Map.Entry<String, List<RawFilter>> entry : map.entrySet()) {
            for (RawFilter value : entry.getValue()) {
                switch (value.type) {
                    case EQUAL:
                    case NOTEQUAL:
                        if (value.data != null) {
                            continue;
                        } else {
                            return false;
                        }
                    case GREATER:
                    case NOTGREATER:
                    case LESS:
                    case NOTLESS:
                        if (value.data != null && value.data.size() > 0 && value.data.get(0) != null) {
                            continue;
                        } else {
                            return false;
                        }
                    case BETWEEN:
                        if (value.data != null && value.data.size() > 1 && value.data.get(0) != null
                                && value.data.get(1) != null) {
                            continue;
                        } else {
                            return false;
                        }
                    default:
                }
            }
        }
        return true;
    }
}

@Documented
@Constraint(validatedBy = Filters.class)
@Target( { ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
@interface FiltersConstraint {
    String message() default "Invalid filtering parameters.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
