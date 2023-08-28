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

import com.epam.deltix.tbwg.messages.ViewState;
import com.epam.deltix.tbwg.messages.ViewType;
import com.epam.deltix.tbwg.webapp.services.view.ViewService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

abstract class ViewMdImpl implements MutableViewMd {

    private String id;
    private long timestamp = Long.MIN_VALUE;
    private String stream;
    private ViewType type = ViewType.PERSISTENT;
    private boolean live;
    private ViewState state = ViewState.CREATED;
    private String description;
    private String info;
    private long lastTimestamp = Long.MIN_VALUE;

    @Override
    public String getId() {
        return id;
    }

    @Override
    public void setId(String id) {
        this.id = id;
    }

    @Override
    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String getStream() {
        return stream != null ? stream : ViewService.getStreamName(id);
    }

    @Override
    public void setStream(String stream) {
        this.stream = stream;
    }

    @Override
    public ViewType getType() {
        return type;
    }

    @Override
    public void setType(ViewType type) {
        this.type = type;
    }

    @Override
    public boolean isLive() {
        return live;
    }

    @Override
    public void setLive(boolean live) {
        this.live = live;
    }

    @Override
    public ViewState getState() {
        return state;
    }

    @Override
    public void setState(ViewState state) {
        this.state = state;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String getInfo() {
        return info;
    }

    @Override
    public void setInfo(String info) {
        this.info = info;
    }

    @Override
    public long getLastTimestamp() {
        return lastTimestamp;
    }

    public void setLastTimestamp(long lastTimestamp) {
        this.lastTimestamp = lastTimestamp;
    }

    @Override
    public Instant getLastTimestampFormatted() {
        return lastTimestamp != Long.MIN_VALUE ? Instant.ofEpochMilli(lastTimestamp) : null;
    }

    @Override
    public List<ViewMdChange> getChanges(ViewMd anotherViewMd) {
        List<ViewMdChange> changes = new ArrayList<>();
        if (state != anotherViewMd.getState()) {
            state = anotherViewMd.getState();
            changes.add(
                new ViewMdChange("state", state.toString(), anotherViewMd.getState().toString())
            );
        }

        return changes;
    }

    @Override
    public String toString() {
        return "ViewMdImpl{" +
            "id='" + id + '\'' +
            ", state=" + state +
            ", lastTimestamp=" + lastTimestamp +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ViewMdImpl viewInfo = (ViewMdImpl) o;
        return lastTimestamp == viewInfo.lastTimestamp &&
            Objects.equals(id, viewInfo.id) &&
            Objects.equals(timestamp, viewInfo.timestamp) &&
            Objects.equals(stream, viewInfo.stream) &&
            type == viewInfo.type &&
            state == viewInfo.state &&
            Objects.equals(description, viewInfo.description) &&
            Objects.equals(info, viewInfo.info);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, timestamp, stream, type, state, description, info, lastTimestamp);
    }
}
