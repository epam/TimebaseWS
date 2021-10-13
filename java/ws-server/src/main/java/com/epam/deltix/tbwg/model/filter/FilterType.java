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
package com.epam.deltix.tbwg.model.filter;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/25/2019
 */
public enum FilterType {
    EQUAL, NOTEQUAL, IN, NOT_IN,
    GREATER, NOTGREATER, LESS, NOTLESS, BETWEEN,
    NULL, NOTNULL,
    STARTS_WITH, ENDS_WITH, CONTAINS, NOT_CONTAINS,
}