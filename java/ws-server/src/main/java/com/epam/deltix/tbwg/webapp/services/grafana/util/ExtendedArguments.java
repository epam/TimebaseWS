/*
 * Copyright 2023 EPAM Systems, Inc
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

package com.epam.deltix.tbwg.webapp.services.grafana.util;

import com.epam.deltix.tbwg.webapp.services.grafana.exc.ConstantParseException;
import com.epam.deltix.tbwg.webapp.services.grafana.exc.ConstantValidationException;
import com.epam.deltix.computations.data.base.MutableArguments;
import com.epam.deltix.grafana.base.annotations.AnnotationUtil;
import com.epam.deltix.grafana.base.annotations.ConstantArgument;

public interface ExtendedArguments extends MutableArguments {

    default void set(ConstantArgument argument, String value) throws ConstantValidationException, ConstantParseException {
        try {
            if (AnnotationUtil.create(argument).test(value)) {
                set(argument.name(), value, argument.type());
            } else {
                throw new ConstantValidationException(argument.name(), value, argument.min(), argument.max());
            }
        } catch (NumberFormatException exc) {
            throw new ConstantParseException(argument, value);
        }
    }
}
