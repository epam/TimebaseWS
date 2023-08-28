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
package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import com.google.common.collect.EvictingQueue;
import com.epam.deltix.qsrv.hf.tickdb.pub.LoadingError;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportEvent;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportEventType;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportState;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;

import java.util.List;

public class ImportProcessReport {

    private volatile SubscriptionChannel channel;
    private final long processId;
    private final EvictingQueue<String> warnings = EvictingQueue.create(10);
    private long warningsCount;
    private ImportProcessWriter writer = null;

    public ImportProcessReport(SubscriptionChannel channel, long processId) {
        this.channel = channel;
        this.processId = processId;
    }

    public void setWriter(ImportProcessWriter writer) {
        this.writer = writer;
    }

    public synchronized void newWarning(LoadingError e) {
        warningsCount++;
        sendToWriter(e.getMessage(), ImportEventType.WARNING);
        warnings.add(e.getMessage());
    }

    public synchronized void sendWarnings() {
        warnings.forEach(this::sendWarning);
        warnings.clear();
    }

    public void sendWarnings(List<String> messages) {
        if (writer != null) {
            for (String message : messages) {
                writer.write(message, ImportEventType.WARNING);
            }
        }
        messages.stream().limit(10).forEach(this::sendWarning);
    }

    public void sendInfo(String message) {
        sendEvent(message, ImportEventType.INFO);
    }

    public void sendInfo(List<String> messages) {
        messages.forEach(this::sendInfo);
    }

    public void sendWarning(String message) {
        sendEvent(message, ImportEventType.WARNING);
    }

    public void sendError(String message) {
        warningsCount++;
        sendEvent(message, ImportEventType.ERROR);
    }

    public void sendProgress(double progress) {
        if (progress < 0.0d) {
            progress = 0.0d;
        }
        if (progress > 1.0d) {
            progress = 1.0d;
        }
        sendEvent(Double.toString(progress), ImportEventType.PROGRESS);
    }

    public void sendState(ImportState state) {
        sendEvent(state.toString(), ImportEventType.STATE);
    }

    private void sendEvent(String message, ImportEventType type) {
        if (writer != null) {
            switch (type) {
                case INFO:
                case ERROR:
                    writer.write(message, type);
            }
        }
        channel.sendMessage(new ImportEvent(processId, message, type));
    }

    public long getWarningsCount() {
        return warningsCount;
    }

    public void updateChannel(SubscriptionChannel channel) {
        this.channel = channel;
    }

    public void sendImportReport(ImportStatus report) {
        if (report == null) return;
        sendState(report.getState());
        sendWarnings(report.getWarnList());
        sendInfo(report.getInfoState());
        report.getErrorList().forEach(this::sendError);
    }

    public void sendToWriter(String message, ImportEventType type) {
        if (writer != null) {
            writer.write(message, type);
        }
    }
}
