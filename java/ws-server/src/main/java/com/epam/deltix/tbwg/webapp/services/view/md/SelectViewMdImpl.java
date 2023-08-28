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
package com.epam.deltix.tbwg.webapp.services.view.md;

import java.util.ArrayList;
import java.util.List;

class SelectViewMdImpl extends ViewMdImpl {

    private long startTimestamp;
    private final List<String> streams = new ArrayList<>();
    private final List<String> types = new ArrayList<>();
    private final List<String> entities = new ArrayList<>();

    public long getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(long startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public List<String> getStreams() {
        return streams;
    }

    public List<String> getTypes() {
        return types;
    }

    public List<String> getEntities() {
        return entities;
    }

}
