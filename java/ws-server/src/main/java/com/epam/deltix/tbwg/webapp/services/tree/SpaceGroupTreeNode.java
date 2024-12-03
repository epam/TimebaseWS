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
package com.epam.deltix.tbwg.webapp.services.tree;

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;

import java.util.*;
import java.util.function.Supplier;

public class SpaceGroupTreeNode extends TreeNode<String> {
    private final DXTickStream stream;
    private final List<String> spaces;
    private final Map<String, List<String>> spaceToSymbols;
    private final Map<String, TreeGroup<String>> groups;

    public SpaceGroupTreeNode(TreeConfig config, DXTickStream stream, String key, String name, TreeNodeType nodeType,
                              List<String> spaces, Map<String, List<String>> spaceToSymbols)
    {
        super(config, key, name, nodeType);
        this.stream = stream;
        this.spaces = spaces;
        this.spaceToSymbols = spaceToSymbols;

        if (this.spaces.size() > config.getSettings().getGroupSize()) {
            this.groups = config.getSplitGroupsStrategy().split(
                this.spaces,
                nodeType == TreeNodeType.GROUP ? key.length() : 1,
                config.getSettings().getGroupSize(),
                s -> s
            );
            this.treeNode.setChildrenCount(groups.size());
        } else {
            this.groups = new HashMap<>();
            this.treeNode.setChildrenCount(spaces.size());
        }

        this.treeNode.setTotalCount(spaces.size());
    }

    public TreeNode<?> findSymbol(String symbol) {
        String symbolSpace = findSymbolSpace(symbol);
        if (symbolSpace == null) return null;
        if (groups.size() > 0) {
            for (Map.Entry<String, TreeGroup<String>> group : groups.entrySet()) {
                if (group.getValue().hasElement(symbolSpace)) {
                    return addChild(group.getKey());
                }
            }
        } else {
            return addChild(symbolSpace);
        }
        return null;
    }

    private String findSymbolSpace(String symbol) {
        for (Map.Entry<String, List<String>> spaseSymbols : spaceToSymbols.entrySet()) {
            if (spaseSymbols.getValue().contains(symbol)) {
                return spaseSymbols.getKey();
            }
        }
        return null;
    }

    @Override
    protected Collection<String> queryChildrenObjects() {
        if (groups.size() > 0) {
            return groups.keySet();
        }

        return spaces;
    }

    @Override
    protected String extractKey(String space) {
        return space;
    }

    @Override
    protected Supplier<TreeNode<?>> childNodeFactory(String space) {
        if (groups.size() > 0) {
            TreeGroup<String> group = groups.get(space);
            return () -> new SpaceGroupTreeNode(
                config, stream, space, group.getName(), TreeNodeType.GROUP,
                group.getElements(), spaceToSymbols
            );
        }

        return () -> {
            List<String> symbols;
            // TODO: 9/18/2024 make spaceToSymbols mandatory
            if (spaceToSymbols != null) {
                symbols = spaceToSymbols.get(space);
                if (symbols == null) {
                    symbols = new ArrayList<>();
                }
            } else {
                symbols = Utils.listSymbols(
                        config.getSpaceEntitiesCache().getStreamSpaceEntities(stream, space),
                        config.getFilter()
                );
            }
            return new SymbolGroupTreeNode(
                config, space, space.isEmpty() ? "root" : space, TreeNodeType.SPACE, symbols
            );
        };
    }
}