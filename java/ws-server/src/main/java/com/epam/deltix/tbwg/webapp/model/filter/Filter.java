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
package com.epam.deltix.tbwg.webapp.model.filter;

import com.epam.deltix.tbwg.webapp.utils.qql.SelectBuilder;

import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/24/2019
 */
public abstract class Filter {
    public Filter(String field, List<?> data) {
        this.field = field;
        this.data = data;
    }

    protected String field;
    protected List<?> data;

    public abstract SelectBuilder appendTo(SelectBuilder selectBuilder) throws SelectBuilder.NoSuchFieldException,
            SelectBuilder.WrongTypeException;

    protected List<String> getList() {
        return data.stream().map(o -> o == null ? null: o.toString()).collect(Collectors.toList());
    }

    protected String getFirstValue() {
        return data.get(0).toString();
    }

    protected String[] getTwo() {
        return new String[] {
                data.get(0).toString(),
                data.get(1).toString()
        };
    }

}
