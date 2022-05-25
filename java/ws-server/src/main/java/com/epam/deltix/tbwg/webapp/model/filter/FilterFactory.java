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
package com.epam.deltix.tbwg.webapp.model.filter;

import com.epam.deltix.tbwg.webapp.model.input.RawFilter;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public class FilterFactory {

    public static Filter createFilter(String field, RawFilter rawFilter) {
        switch (rawFilter.type) {
            case EQUAL:
                return new EqualFilter(field, rawFilter.data);
            case NOTEQUAL:
                return new NotEqualFilter(field, rawFilter.data);
            case GREATER:
                return new GreaterFilter(field, rawFilter.data);
            case NOTGREATER:
                return new NotGreaterFilter(field, rawFilter.data);
            case LESS:
                return new LessFilter(field, rawFilter.data);
            case NOTLESS:
                return new NotLessFilter(field, rawFilter.data);
            case BETWEEN:
                return new BetweenFilter(field, rawFilter.data);
            case NULL:
                return new NullFilter(field);
            case NOTNULL:
                return new NotNullFilter(field);
            default:
                throw new UnsupportedOperationException();
        }
    }

}
