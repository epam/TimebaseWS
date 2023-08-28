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
package com.epam.deltix.tbwg.webapp.services.view.processor;

import com.epam.deltix.tbwg.messages.ViewState;

public class ViewProcessingEvent {

    private final String viewId;
    private final ViewState state;
    private final long lastTimestamp;
    private final Throwable error;
    private final String reason;

    public static ViewProcessingEvent makeStarted(String viewId, long lastTimestamp) {
        return new ViewProcessingEvent(viewId, ViewState.PROCESSING, lastTimestamp, null, null);
    }

    public static ViewProcessingEvent makeRestarted(String viewId) {
        return new ViewProcessingEvent(viewId, ViewState.RESTARTED, Long.MIN_VALUE, null, null);
    }

    public static ViewProcessingEvent makeProgress(String viewId, long lastTimestamp) {
        return new ViewProcessingEvent(viewId, ViewState.PROCESSING, lastTimestamp, null, null);
    }

    public static ViewProcessingEvent makeIdling(String viewId, long lastTimestamp) {
        return new ViewProcessingEvent(viewId, ViewState.IDLING, lastTimestamp, null, null);
    }

    public static ViewProcessingEvent makeFinished(String viewId, long lastTimestamp) {
        return new ViewProcessingEvent(viewId, ViewState.COMPLETED, lastTimestamp, null, null);
    }

    public static ViewProcessingEvent makeFailed(String viewId, long lastTimestamp, Throwable error, String reason) {
        return new ViewProcessingEvent(viewId, ViewState.FAILED, lastTimestamp, error, reason);
    }

    private ViewProcessingEvent(String viewId, ViewState state, long lastTimestamp, Throwable error, String reason) {
        this.viewId = viewId;
        this.state = state;
        this.lastTimestamp = lastTimestamp;
        this.error = error;
        this.reason = reason;
    }

    public String getViewId() {
        return viewId;
    }

    public ViewState getState() {
        return state;
    }

    public long getLastTimestamp() {
        return lastTimestamp;
    }

    public Throwable getError() {
        return error;
    }

    public String getReason() {
        return reason;
    }

    @Override
    public String toString() {
        return "ViewProcessingEvent{" +
            "viewId='" + viewId + '\'' +
            ", state=" + state +
            ", lastTimestamp=" + lastTimestamp +
            ", error=" + error +
            ", reason='" + reason + '\'' +
            '}';
    }
}
