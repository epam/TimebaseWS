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
package com.epam.deltix.tbwg.webapp.services.tree;

import lombok.Getter;
import lombok.Setter;

import java.util.*;

@Getter
@Setter
class TreeGroup<T> {

    private final String name;
    private final List<T> elements = new ArrayList<>();
    private final Set<T> elementsSet = new HashSet<>();

    public TreeGroup(String name, List<T> elements) {
        this.name = name;
        this.elements.addAll(elements);
        this.elementsSet.addAll(elements);
    }

    public boolean hasElement(T element) {
        return elementsSet.contains(element);
    }

}
