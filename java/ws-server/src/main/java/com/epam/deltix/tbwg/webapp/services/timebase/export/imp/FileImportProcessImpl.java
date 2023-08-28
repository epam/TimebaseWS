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
package com.epam.deltix.tbwg.webapp.services.timebase.export.imp;

import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;

import java.io.*;

public class FileImportProcessImpl implements FileImportProcess {

    private final static int BUFFER_SIZE = 1024 * 1024;

    private final long id;
    private final String fileName;
    private final long size;
    private final File fileOnDisk;
    private final ImportSettings settings;

    private volatile ImportTask task;
    private volatile boolean cancelled;

    private long updateTime;

    public FileImportProcessImpl(File directory, String diskFileName, long id, String fileName, long size, ImportSettings settings) {
        this.id = id;
        this.fileName = fileName;
        this.size = size;
        this.settings = settings;
        this.fileOnDisk = new File(directory, diskFileName);
        if (fileOnDisk.exists()) {
            fileOnDisk.delete();
        }
        fileOnDisk.deleteOnExit();
        update();
    }

    @Override
    public long id() {
        return id;
    }

    @Override
    public synchronized void write(InputStream is, long offset, long size) {
        update();
        try (FileOutputStream outputStream = new FileOutputStream(fileOnDisk, true)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int length;
            while ((length = is.read(buffer)) > 0) {
                outputStream.write(buffer, 0, length);
            }
        } catch (Throwable t) {
            throw new RuntimeException(t);
        } finally {
            update();
        }
    }

    @Override
    public InputStream read() throws FileNotFoundException {
        update();
        return new FileInputStream(fileOnDisk);
    }

    @Override
    public String fileName() {
        return fileName;
    }

    @Override
    public long getSize() {
        return size;
    }

    @Override
    public ImportSettings importSettings() {
        return settings;
    }

    @Override
    public long changeTime() {
        return updateTime;
    }

    @Override
    public void update() {
        updateTime = System.currentTimeMillis();
    }

    @Override
    public void importTask(ImportTask task) {
        this.task = task;
        if (cancelled) {
            task.cancel();
        }
    }

    @Override
    public boolean ready() {
        return size == fileOnDisk.length();
    }

    @Override
    public boolean isRunningTask() {
        return task != null && task.getImportState() == ImportState.STARTED;
    }

    @Override
    public void updateTaskChannel(SubscriptionChannel channel) {
        if (task != null){
            task.updateChannel(channel);
        }
    }

    @Override
    public void close() {
        cancelled = true;
        if (task != null) {
            task.cancel();
        }
        if (fileOnDisk.exists()) {
            fileOnDisk.delete();
        }
    }
}
