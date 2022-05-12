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

import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.model.tree.StreamTreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class TickDbTreeNode extends TreeNode<DXTickStream> {
    private final List<DXTickStream> streams;

    public TickDbTreeNode(TreeConfig config, TimebaseService db) {
        super(config, db.getId(), TreeNodeType.DB);

        this.streams = Arrays.asList(db.listStreams());
        this.streams.sort(Comparator.comparing(DXTickStream::getKey));
        this.treeNode.setChildrenCount(streams.size());
    }

    @Override
    protected Collection<DXTickStream> queryChildrenObjects() {
        return streams;
    }

    @Override
    protected boolean matchFilter() {
        return true; // db node always visible
    }

    @Override
    protected Supplier<TreeNode<?>> childNodeFactory(DXTickStream stream) {
        return () -> {
            if (config.isShowSpaces()) {
                String[] spacesArray = stream.listSpaces();
                if (spacesArray != null) {
                    List<String> spaces = Arrays.asList(spacesArray);
                    spaces.sort(Comparator.comparing(s -> s));
                    SpaceGroupTreeNode treeNode;
                    if (config.getFilter() != null) {
                        Map<String, List<String>> spaceToSymbols = listSpaceSymbols(stream, spaces, config.getFilter());
                        spaces = spaces.stream().filter(s ->
                            spaceToSymbols.containsKey(s) || s.toLowerCase().contains(config.getFilter())
                        ).collect(Collectors.toList());
                        treeNode = new SpaceGroupTreeNode(config, stream,
                            stream.getKey(), stream.getKey(), TreeNodeType.STREAM,
                            spaces, spaceToSymbols
                        );
                    } else {
                        treeNode = new SpaceGroupTreeNode(config, stream,
                            stream.getKey(), stream.getKey(), TreeNodeType.STREAM,
                            spaces, null
                        );
                    }

                    return setTreeNodeMetadata(treeNode, stream);
                }
            }

            List<String> entities = Utils.listSymbols(stream, config.getFilter());
            return setTreeNodeMetadata(
                new SymbolGroupTreeNode(
                    config, stream.getKey(), stream.getKey(), TreeNodeType.STREAM, entities
                ), stream
            );
        };
    }

    @Override
    protected String extractKey(DXTickStream stream) {
        return stream.getKey();
    }

    private Map<String, List<String>> listSpaceSymbols(DXTickStream stream, List<String> spaces, String filter) {
        Map<String, List<String>> spaceToSymbols = new HashMap<>();
        for (String space : spaces) {
            List<String> entities = Utils.listSymbols(
                config.getSpaceEntitiesCache().getStreamSpaceEntities(stream, space), filter
            );
            if (entities.size() > 0) {
                spaceToSymbols.put(space, entities);
            }
        }

        return spaceToSymbols;
    }

    private TreeNode<?> setTreeNodeMetadata(TreeNode<?> treeNode, DXTickStream stream) {
        TreeNodeDef treeNodeDef = treeNode.getTreeNodeDef();
        if (treeNodeDef instanceof StreamTreeNodeDef) {
            ((StreamTreeNodeDef) treeNodeDef).setChartType(Arrays.asList(TBWGUtils.chartTypes(stream)));
        }

        return treeNode;
    }

}
