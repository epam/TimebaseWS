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
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.DirectChannel;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.settings.TopicSettings;
import com.epam.deltix.tbwg.webapp.model.tree.TreeNodeDef;
import com.epam.deltix.tbwg.webapp.services.tree.TreeFilter;

import java.util.List;

public interface TopicService {

    List<String> listTopics();

    DirectChannel createTopic(String key, RecordClassDescriptor[] types, TopicSettings settings);

    TreeNodeDef getStructure(TreeFilter treeFilter);

    void delete(String key);

    RecordClassDescriptor[] getTypes(String key);

    void rename(String topicKey, String newKey);

    void subscribe(TopicListener listener);
    void unsubscribe(TopicListener listener);
}