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
package com.epam.deltix.tbwg.webapp.services.tree;

import com.epam.deltix.tbwg.webapp.model.tree.StreamTreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public abstract class TreeNode<TChild> {
    protected final TreeConfig config;
    protected final Map<String, TreeNode<?>> childrenNodes = new HashMap<>();
    protected final TreeNodeDef treeNode;
    protected final boolean matchSelf;

    private Collection<TChild> childrenObjects;
    private Map<String, TChild> childrenObjectsMap;

    public TreeNode(TreeConfig settings, String id, TreeNodeType type) {
        this(settings, id, id, type);
    }

    public TreeNode(TreeConfig config, String id, String name, TreeNodeType type) {
        this.config = config;
        this.treeNode = type == TreeNodeType.STREAM ?
            new StreamTreeNodeDef(id, name, type) :
            new TreeNodeDef(id, name, type);
        this.matchSelf = config.getFilter() != null &&
            (id.toLowerCase().contains(config.getFilter()) || name.toLowerCase().contains(config.getFilter()));
    }

    public void addAllChildren() {
        childrenObjects().forEach((value) ->
            createAndAddChildNode(extractKey(value), childNodeFactory(value))
        );
    }

    public TreeNode<?> addChild(String id) {
        TChild childObj = childObject(id);
        if (childObj != null) {
            return createAndAddChildNode(extractKey(childObj), childNodeFactory(childObj));
        }

        return null;
    }

    public TreeNodeDef getTreeNodeDef() {
        return treeNode;
    }

    protected abstract Collection<TChild> queryChildrenObjects();
    protected abstract Supplier<TreeNode<?>> childNodeFactory(TChild obj);
    protected abstract String extractKey(TChild obj);

    protected boolean matchFilter() {
        return config.getFilter() == null || matchSelf || treeNode.getChildrenCount() > 0;
    }

    private TreeNode<?> createAndAddChildNode(String key, Supplier<TreeNode<?>> nodeFactory) {
        TreeNode<?> node = childrenNodes.get(key);
        if (node == null) {
            addChildNode(key, node = nodeFactory.get());
        }

        return node;
    }

    private void addChildNode(String id, TreeNode<?> childNode) {
        childrenNodes.put(id, childNode);
        if (childNode.matchFilter()) {
            treeNode.getChildren().add(childNode.treeNode);
        }
    }

    private Collection<TChild> childrenObjects() {
        if (childrenObjects == null) {
            childrenObjects = queryChildrenObjects();
        }

        return childrenObjects;
    }

    private TChild childObject(String id) {
        return childrenObjectsMap().get(id);
    }

    private Map<String, TChild> childrenObjectsMap() {
        if (childrenObjectsMap == null) {
            childrenObjectsMap = queryChildrenObjects().stream()
                .collect(Collectors.toMap(this::extractKey, k -> k, (k1, k2) -> k1));
        }

        return childrenObjectsMap;
    }

}
