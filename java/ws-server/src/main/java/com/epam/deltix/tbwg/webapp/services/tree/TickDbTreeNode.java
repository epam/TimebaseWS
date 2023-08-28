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

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.model.tree.StreamTreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;
import com.epam.deltix.tbwg.webapp.model.tree.ViewTreeNodeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class TickDbTreeNode extends TreeNode<TickDbTreeNode.DBTreeContent> {
    static class DBTreeContent {
        protected final DXTickStream stream;

        public DBTreeContent(DXTickStream stream) {
            this.stream = stream;
        }

        DXTickStream getStream() {
            return stream;
        }

        String getKey() {
            return stream.getKey();
        }

        String getName() {
            return stream.getName();
        }
    }

    static class DBTreeContentView extends DBTreeContent {
        private final ViewMd viewMd;

        public DBTreeContentView(ViewMd viewMd, DXTickStream stream) {
            super(stream);
            this.viewMd = viewMd;
        }

        @Override
        String getKey() {
            return stream != null ? stream.getKey() : ViewService.getStreamName(viewMd.getId());
        }

        @Override
        String getName() {
            return viewMd.getId();
        }
    }

    private final List<DBTreeContent> content;

    public TickDbTreeNode(TreeConfig config, TimebaseService db, ViewService viewService) {
        super(config, db.getId(), TreeNodeType.DB);

        if (config.isViews()) {
            this.content = viewService.list().stream()
                .map(v -> new DBTreeContentView(v, db.getStream(v.getStream())))
                .collect(Collectors.toList());
        } else {
            if (config.getSettings().isShowViewStreams()) {
                this.content = Arrays.stream(db.listStreams())
                    .map(DBTreeContent::new)
                    .collect(Collectors.toList());
            } else {
                this.content = Arrays.stream(db.listStreams())
                    .filter(s -> !ViewService.isViewStream(s.getKey()))
                    .filter(s -> !ViewService.STREAM_VIEW_INFO.equals(s.getKey()))
                    .map(DBTreeContent::new)
                    .collect(Collectors.toList());
            }
        }

        this.content.sort(Comparator.comparing(DBTreeContent::getKey, String.CASE_INSENSITIVE_ORDER));
        this.treeNode.setChildrenCount(content.size());
        this.treeNode.setTotalCount(content.size());
    }

    @Override
    protected Collection<DBTreeContent> queryChildrenObjects() {
        return content;
    }

    @Override
    protected boolean matchFilter() {
        return true; // db node always visible
    }

    @Override
    protected Supplier<TreeNode<?>> childNodeFactory(DBTreeContent content) {
        return () -> {
            DXTickStream stream = content.getStream();
            if (config.isShowSpaces() && stream != null) {
                String[] spacesArray = stream.listSpaces();
                if (spacesArray != null) {
                    List<String> spaces = Arrays.asList(spacesArray);
                    spaces.sort(Comparator.comparing(s -> s, String.CASE_INSENSITIVE_ORDER));
                    SpaceGroupTreeNode treeNode;
                    if (config.getFilter() != null) {
                        Map<String, List<String>> spaceToSymbols = Utils.listSpaceSymbols(
                            stream, config.getSpaceEntitiesCache(), spaces, config.getFilter()
                        );
                        spaces = spaces.stream().filter(s ->
                            spaceToSymbols.containsKey(s) || config.getFilter().test(s)
                        ).collect(Collectors.toList());
                        treeNode = new SpaceGroupTreeNode(config, stream,
                            content.getKey(), content.getName(), treeNodeType(),
                            spaces, spaceToSymbols
                        );
                    } else {
                        treeNode = new SpaceGroupTreeNode(config, stream,
                            content.getKey(), content.getName(), treeNodeType(),
                            spaces, null
                        );
                    }

                    return setTreeNodeMetadata(treeNode, content);
                }
            }

            List<String> entities = Utils.listSymbols(stream, config.getFilter());
            return setTreeNodeMetadata(
                new SymbolGroupTreeNode(
                    config, content.getKey(), content.getName(), treeNodeType(), entities
                ), content
            );
        };
    }

    private TreeNodeType treeNodeType() {
        return config.isViews() ? TreeNodeType.VIEW : TreeNodeType.STREAM;
    }

    @Override
    protected String extractKey(DBTreeContent stream) {
        return stream.getKey();
    }

    private TreeNode<?> setTreeNodeMetadata(TreeNode<?> treeNode, DBTreeContent content) {
        TreeNodeDef treeNodeDef = treeNode.getTreeNodeDef();
        if (treeNodeDef instanceof StreamTreeNodeDef) {
            ((StreamTreeNodeDef) treeNodeDef).setChartType(Arrays.asList(TBWGUtils.chartTypes(content.getStream())));
        }
        if (treeNodeDef instanceof ViewTreeNodeDef && content instanceof DBTreeContentView) {
            ((ViewTreeNodeDef) treeNodeDef).setChartType(Arrays.asList(TBWGUtils.chartTypes(content.getStream())));
            ((ViewTreeNodeDef) treeNodeDef).setViewMd(((DBTreeContentView) content).viewMd);
        }

        return treeNode;
    }

}
