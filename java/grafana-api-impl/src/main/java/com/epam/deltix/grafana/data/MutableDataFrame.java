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
package com.epam.deltix.grafana.data;

import com.epam.deltix.grafana.model.fields.Column;
import com.epam.deltix.grafana.model.DataFrame;

public interface MutableDataFrame extends DataFrame {

    /**
     * Adds column to dataframe. Missing values will be filled with nones.
     * @param column new column
     */
    void addColumn(Column column);

    boolean hasColumn(String column);

    /**
     * Appends row to dataframe. Values must be defined in fields order.
     * Size of array must be equal to number of fields.
     * @param values row to append
     */
    void append(Object[] values);

    /**
     * Inserts row in dataframe on provided index.
     * @param index insert position
     * @param values row to insert
     */
    void insert(int index, Object[] values);

    /**
     * Removes row from dataframe on index.
     * @param index position of row to remove
     */
    void remove(int index);

}
