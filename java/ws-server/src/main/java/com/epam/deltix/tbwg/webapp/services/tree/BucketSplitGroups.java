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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

class BucketSplitGroups implements SplitGroupsStrategy {

    @Override
    public <T> Map<String, TreeGroup<T>> split(List<T> elements, int prefixLength, int initialGroupSize, Function<T, String> keyProvider) {
        int groupSize = initialGroupSize;
        while (groupSize * initialGroupSize < elements.size()) {
            groupSize *= initialGroupSize;
        }

        Map<String, TreeGroup<T>> groups = new LinkedHashMap<>();
        int groupNumber = 0;
        boolean stop = false;
        while (!stop) {
            int start = groupNumber * groupSize;
            int end = (groupNumber + 1) * groupSize;
            String groupId = start + ".." + end;
            if (end >= elements.size()) {
                end = elements.size();
                stop = true;
            }

            List<T> groupElements = elements.subList(start, end);
            String startName = keyProvider.apply(groupElements.get(0));
            String endName = keyProvider.apply(groupElements.get(groupElements.size() - 1));
            String groupName = "[" + (startName.isEmpty() ? "root" : startName) + ".." +
                (endName.isEmpty() ? "root" : endName) + "]";

            groups.put(groupId, new TreeGroup<>(groupName, groupElements));

            ++groupNumber;
        }

        return groups;
    }

}
