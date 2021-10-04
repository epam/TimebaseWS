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
package com.epam.deltix.tbwg.model.grafana.queries;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.tbwg.model.grafana.time.TimeRange;

import java.util.List;

public class DataQueryRequest<T extends DataQuery> {

    @JsonProperty
    protected String requestId;

    @JsonProperty
    protected long dashboardId;

    @JsonProperty
    protected String interval;

    @JsonProperty
    protected Long intervalMs;

    @JsonProperty
    protected Integer maxDataPoints;

    @JsonProperty
    protected String panelId;

    @JsonProperty
    protected TimeRange range;

    @JsonProperty
    protected Boolean reverse;

    @JsonProperty
    protected List<T> targets;

    @JsonProperty
    protected String timezone;

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public long getDashboardId() {
        return dashboardId;
    }

    public void setDashboardId(long dashboardId) {
        this.dashboardId = dashboardId;
    }

    public String getInterval() {
        return interval;
    }

    public void setInterval(String interval) {
        this.interval = interval;
    }

    public Long getIntervalMs() {
        return intervalMs;
    }

    public void setIntervalMs(Long intervalMs) {
        this.intervalMs = intervalMs;
    }

    public Integer getMaxDataPoints() {
        return maxDataPoints;
    }

    public void setMaxDataPoints(Integer maxDataPoints) {
        this.maxDataPoints = maxDataPoints;
    }

    public String getPanelId() {
        return panelId;
    }

    public void setPanelId(String panelId) {
        this.panelId = panelId;
    }

    public TimeRange getRange() {
        return range;
    }

    public void setRange(TimeRange range) {
        this.range = range;
    }

    public Boolean getReverse() {
        return reverse;
    }

    public void setReverse(Boolean reverse) {
        this.reverse = reverse;
    }

    public List<T> getTargets() {
        return targets;
    }

    public void setTargets(List<T> targets) {
        this.targets = targets;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
}
