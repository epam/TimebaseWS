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
package com.epam.deltix.tbwg.webapp.model.tree;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class TreeNodeDef {

    private String id;
    private String name;
    private TreeNodeType type;
    private long childrenCount;
    private long totalCount;
    private List<TreeNodeDef> children = new ArrayList<>();

    public TreeNodeDef(String id, TreeNodeType type) {
        this(id, id, type);
    }

    public TreeNodeDef(String id, String name, TreeNodeType type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }

    public long getChildrenCount() {
        return children.size() > 0 ? children.size() : childrenCount;
    }
}
