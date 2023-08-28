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

import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateNotifier;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.tbwg.webapp.events.TimeBaseEvent;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.SystemMessagesService;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.settings.TimeBaseTreeSettings;
import org.springframework.context.ApplicationListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimeBaseTreeServiceImpl implements TimeBaseTreeService, DBStateListener, ApplicationListener<TimeBaseEvent> {

    private static class TreePath {
        private final String[] elements;

        public TreePath(String path) {
            if (path.equals("/")) {
                this.elements = new String[] { "" };
            } else {
                this.elements = Arrays.stream(path.split("/", -1))
                    .map(e -> {
                        try {
                            return URLDecoder.decode(e, StandardCharsets.UTF_8.toString());
                        } catch (UnsupportedEncodingException ex) {
                            throw new RuntimeException(ex);
                        }
                    })
                    .toArray(String[]::new);
            }
        }

        public String element(int i) {
            if (i >= elements.length || i < 0) {
                return null;
            }

            return elements[i];
        }

        public boolean isLast(int depth) {
            return elements.length == depth;
        }
    }

    private final TimeBaseTreeSettings settings;
    private final TimebaseService timebaseService;
    private final ViewService viewService;

    private final SplitGroupsStrategy splitGroupsStrategy = new BucketSplitGroups();
    private final SpaceEntitiesCache spaceEntitiesCache;

    public TimeBaseTreeServiceImpl(TimeBaseTreeSettings settings,
                                   TimebaseService timebaseService, ViewService viewService,
                                   SystemMessagesService messagesService) {
        this.settings = settings;
        this.timebaseService = timebaseService;
        this.viewService = viewService;
        this.spaceEntitiesCache = new SpaceEntitiesCacheImpl();
        messagesService.subscribe(this);
    }

    @PreDestroy
    public void destroy() {
        DXTickDB db = timebaseService.getConnection();
        if (db instanceof DBStateNotifier) {
            ((DBStateNotifier) db).removeStateListener(this);
        }
    }

    @Scheduled(fixedDelayString = "${timebase.tree.invalidate-cache-period-ms:60000}")
    public void reload() {
        spaceEntitiesCache.invalidate();
    }

    @Override
    public void onApplicationEvent(TimeBaseEvent event) {
        spaceEntitiesCache.invalidate();
    }

    @Override
    public void changed(String key) {
        spaceEntitiesCache.invalidate(key);
    }

    @Override
    public void added(String key) {
    }

    @Override
    public void deleted(String key) {
        spaceEntitiesCache.invalidate(key);
    }

    @Override
    public void renamed(String fromKey, String toKey) {
        spaceEntitiesCache.invalidate(fromKey);
    }

    @Override
    public TreeNodeDef buildTree(List<String> paths, TreeFilter filter, boolean showSpaces, boolean views) {
        List<TreePath> treePaths = paths.stream()
            .map(TreePath::new)
            .collect(Collectors.toList());

        return walk(
            new TickDbTreeNode(
                new TreeConfig(filter, showSpaces, views, settings, splitGroupsStrategy, spaceEntitiesCache),
                timebaseService, viewService
            ),
            treePaths, 1
        ).getTreeNodeDef();
    }

    @Override
    public String findSymbol(String stream, String symbol, boolean showSpaces, boolean views) {
        // todo: the method is in progress

        TickDbTreeNode dbTreeNode = new TickDbTreeNode(
            new TreeConfig(null, showSpaces, views, settings, splitGroupsStrategy, spaceEntitiesCache),
            timebaseService, viewService
        );

        String result = "";
        TreeNode<?> node = dbTreeNode.addChild(stream);
        if (node == null) {
            return result;
        }

        while (true) {
            result += "/" + node.treeNode.getId();
            if (node instanceof SymbolGroupTreeNode) {
                node = ((SymbolGroupTreeNode) node).findSymbol(symbol);
                continue;
            } else if (node instanceof SpaceGroupTreeNode) {

            } else if (node instanceof SymbolTreeNode) {
                break;
            }

            break;
        }

        return result;
    }

    private static TreeNode<?> walk(TreeNode<?> node, List<TreePath> treePaths, int depth) {
        for (TreePath path : treePaths) {
            if (path.isLast(depth)) {
                node.addAllChildren();
                break;
            }
        }

        pathsOnLevel(treePaths, depth).forEach((id, paths) -> {
            TreeNode<?> childNode = node.addChild(id);
            if (childNode != null) {
                walk(childNode, paths, depth + 1);
            }
        });

        return node;
    }

    private static Map<String, List<TreePath>> pathsOnLevel(List<TreePath> openPaths, int level) {
        Map<String, List<TreePath>> result = new HashMap<>();
        openPaths.forEach(p -> {
            String element = p.element(level);
            if (element != null) {
                result.computeIfAbsent(element, k -> new ArrayList<>()).add(p);
            }
        });

        return result;
    }
}
