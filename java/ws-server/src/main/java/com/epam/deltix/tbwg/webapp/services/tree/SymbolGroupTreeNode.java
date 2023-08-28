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

import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

public class SymbolGroupTreeNode extends TreeNode<String> {
    private final List<String> symbols;
    private final Map<String, TreeGroup<String>> groups;

    public SymbolGroupTreeNode(TreeConfig config, String key, String name, TreeNodeType nodeType, List<String> symbols) {
        super(config, key, name, nodeType);

        this.symbols = symbols;
        if (this.symbols.size() > config.getSettings().getGroupSize()) {
            this.groups = config.getSplitGroupsStrategy().split(
                this.symbols,
                nodeType == TreeNodeType.GROUP ? key.length() : 1,
                config.getSettings().getGroupSize(),
                e -> e
            );
            this.treeNode.setChildrenCount(groups.size());
        } else {
            this.groups = new HashMap<>();
            this.treeNode.setChildrenCount(symbols.size());
        }

        this.treeNode.setTotalCount(symbols.size());
    }

    // todo: the logic is in progress
    public TreeNode<?> findSymbol(String symbol) {
        if (groups.size() > 0) {
            for (Map.Entry<String, TreeGroup<String>> group : groups.entrySet()) {
                if (group.getValue().hasElement(symbol)) {
                    return addChild(group.getKey());
                }
            }
        } else {
            return addChild(symbol);
        }

        return null;
    }

    @Override
    protected Collection<String> queryChildrenObjects() {
        if (groups.size() > 0) {
            return groups.keySet();
        }

        return symbols;
    }

    @Override
    protected String extractKey(String symbol) {
        return symbol;
    }

    @Override
    protected Supplier<TreeNode<?>> childNodeFactory(String symbol) {
        if (groups.size() > 0) {
            TreeGroup<String> group = groups.get(symbol);
            return () -> new SymbolGroupTreeNode(
                config, symbol, group.getName(), TreeNodeType.GROUP, group.getElements()
            );
        }

        return () -> new SymbolTreeNode(config, symbol);
    }
}
