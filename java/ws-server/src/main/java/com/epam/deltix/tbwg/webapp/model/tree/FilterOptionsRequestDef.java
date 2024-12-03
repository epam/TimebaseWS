/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.model.tree;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class FilterOptionsRequestDef {

    /**
     * Determines whether regular expressions or wild cards will be used
     * If null, a simple comparison will be used.
     */
    private FilterType use;
    /**
     * Defines how the match will be determined
     * true - the filter will be applied only to the main element (stream, view), nested elements will be returned completely
     * false - the filter will be applied to all elements and will return only those branches where there is a match at any level
     */
    private boolean filterRootOnly;
    /**
     * Defines how the match will be determined
     * true - only a complete match is allowed
     * false - even if only part of the element matches the filter
     */
    private boolean matchExactly;

}