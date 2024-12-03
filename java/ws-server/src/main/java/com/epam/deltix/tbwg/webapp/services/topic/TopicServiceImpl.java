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
package com.epam.deltix.tbwg.webapp.services.topic;

import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.util.SchemaMergeHelper;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.DirectChannel;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.settings.TopicSettings;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeType;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.tree.TreeFilter;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class TopicServiceImpl implements TopicService {


    private final TimebaseService timebaseService;
    private final List<TopicListener> listeners = new CopyOnWriteArrayList<>();

    @Autowired
    public TopicServiceImpl(TimebaseService timebaseService) {
        this.timebaseService = timebaseService;
    }


    @Override
    public List<String> listTopics() {
        return timebaseService.getTopicDB().listTopics();
    }

    @Override
    public DirectChannel createTopic(String key, RecordClassDescriptor[] types, TopicSettings settings) {
        String copyToStream = settings.getCopyToStream();
        if (copyToStream != null) {
            DXTickStream stream = timebaseService.getStream(copyToStream);
            if (stream == null) {
                TBWGUtils.validateStreamKey(copyToStream);
                timebaseService.getOrCreateStream(copyToStream, (options) -> { }, types);
            } else {
                if (!SchemaMergeHelper.containsAll(stream.getTypes(), types)) {
                    throw new IllegalArgumentException("Duplicate stream scheme is not comparable with the topic scheme");
                }
            }
        }
        DirectChannel topic = timebaseService.getTopicDB().createTopic(key, types, settings);
        listeners.forEach(l -> l.topicCreated(key));
        return topic;
    }

    @Override
    public TreeNodeDef getStructure(TreeFilter treeFilter) {
        TreeNodeDef structure = new TreeNodeDef(timebaseService.getId(), timebaseService.getId(), TreeNodeType.TOPIC);
        List<String> listTopics = listTopics();
        if (treeFilter != null) {
            listTopics = listTopics.stream().filter(treeFilter::test).collect(Collectors.toList());
        }
        List<TreeNodeDef> children = listTopics.stream()
                .map(s -> new TreeNodeDef(s, s, TreeNodeType.TOPIC))
                .collect(Collectors.toList());
        structure.setChildren(children);
        structure.setChildrenCount(children.size());
        structure.setTotalCount(children.size());
        return structure;
    }

    @Override
    public void delete(String key) {
        timebaseService.getTopicDB().deleteTopic(key);
        listeners.forEach(l -> l.topicDeleted(key));
    }

    @Override
    public RecordClassDescriptor[] getTypes(String key) {
        return timebaseService.getTopicDB().getTypes(key);
    }

    @Override
    public void rename(String topicKey, String newKey) {
        listeners.forEach(l -> l.topicRename(topicKey, newKey));
    }

    @Override
    public void subscribe(TopicListener listener) {
        listeners.add(listener);
    }

    @Override
    public void unsubscribe(TopicListener listener) {
        listeners.remove(listener);
    }
}