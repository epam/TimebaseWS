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

import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateNotifier;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.tbwg.webapp.events.TimeBaseEvent;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;
import com.epam.deltix.tbwg.webapp.services.timebase.SystemMessagesService;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;
import com.epam.deltix.tbwg.webapp.settings.TimeBaseTreeSettings;
import org.springframework.context.ApplicationListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
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
                this.elements = new String[]{""};
            } else {
                this.elements = Arrays.stream(path.split("/", -1))
                        .map(e -> URLDecoder.decode(e, StandardCharsets.UTF_8))
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
    private final TimebaseRegistry registry;
    private final ViewService viewService;
    private final SystemMessagesService messagesService;

    private final SplitGroupsStrategy splitGroupsStrategy = new BucketSplitGroups();
    private final SpaceEntitiesCache spaceEntitiesCache;

    public TimeBaseTreeServiceImpl(TimeBaseTreeSettings settings,
                                   TimebaseRegistry registry, ViewService viewService,
                                   SystemMessagesService messagesService) {
        this.settings = settings;
        this.registry = registry;
        this.viewService = viewService;
        this.messagesService = messagesService;
        this.spaceEntitiesCache = new SpaceEntitiesCacheImpl();
        messagesService.masterNotifier().subscribe(this);
    }

    @PreDestroy
    public void destroy() {
        messagesService.masterNotifier().unsubscribe(this);
        for (TimebaseService svc : registry.getAll()) {
            try {
                DXTickDB db = svc.getConnection();
                if (db instanceof DBStateNotifier) {
                    ((DBStateNotifier) db).removeStateListener(this);
                }
            } catch (Exception ignored) {
            }
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
    public TreeNodeDef buildTree(List<String> paths, TreeFilter filter, boolean showSpaces, boolean views, boolean filterRootOnly) {
        List<TimebaseService> allServices = registry.getAll();

        if (allServices.size() == 1) {
            List<TreePath> treePaths = paths.stream().map(TreePath::new).collect(Collectors.toList());
            return walk(
                new TickDbTreeNode(
                    new TreeConfig(filter, showSpaces, views, filterRootOnly, settings, splitGroupsStrategy, spaceEntitiesCache),
                    allServices.get(0), viewService
                ),
                treePaths, 1
            ).getTreeNodeDef();
        }

        // Multi-instance: virtual ROOT node, one DB child per TB.
        // Paths start with /{tbId}/... or "/" to expand everything.
        TreeNodeDef root = new TreeNodeDef("", "", TreeNodeType.ROOT);
        for (TimebaseService tb : allServices) {
            String tbId = tb.getId();
            TreeConfig config = new TreeConfig(filter, showSpaces, views, filterRootOnly, settings, splitGroupsStrategy, spaceEntitiesCache);
            TickDbTreeNode dbNode = new TickDbTreeNode(config, tb, viewService);

            List<TreePath> tbPaths = paths.stream()
                .filter(p -> p.equals("/") || isPathForTb(p, tbId))
                .map(p -> p.equals("/") ? "/" : stripTbPrefix(p, tbId))
                .map(TreePath::new)
                .collect(Collectors.toList());
            TreeNodeDef dbDef = tbPaths.isEmpty() ? dbNode.getTreeNodeDef() : walk(dbNode, tbPaths, 1).getTreeNodeDef();

            root.getChildren().add(dbDef);
        }

        root.setChildrenCount(root.getChildren().size());
        root.setTotalCount(root.getChildren().size());
        return root;
    }

    private static boolean isPathForTb(String path, String tbId) {
        return path.equals("/" + tbId) || path.startsWith("/" + tbId + "/");
    }

    private static String stripTbPrefix(String path, String tbId) {
        String prefix = "/" + tbId;
        if (path.equals(prefix)) {
            return "/";
        }
        return path.substring(prefix.length()); // "/tb1/streamA" → "/streamA"
    }

    @Override
    public TreeNodeDef findSymbolTree(String tbId, String stream, String symbol, boolean showSpaces, boolean views) {
        TimebaseService tb = registry.resolve(tbId);
        TickDbTreeNode dbTreeNode = new TickDbTreeNode(
            new TreeConfig(null, showSpaces, views, false, settings, splitGroupsStrategy, spaceEntitiesCache),
            tb, viewService
        );

        TreeNode<?> node = dbTreeNode.addChild(stream);

        while (true) {
            if (node == null) {
                break;
            } else {
                node.addAllChildren();
            }

            String id = node.treeNode.getId();
            if (id.equals(symbol)) break;

            if (node instanceof SymbolGroupTreeNode) {
                node = ((SymbolGroupTreeNode) node).findSymbol(symbol);
                continue;
            } else if (node instanceof SpaceGroupTreeNode) {
                node = ((SpaceGroupTreeNode) node).findSymbol(symbol);
                continue;
            }
            break;
        }

        return dbTreeNode.getTreeNodeDef();
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