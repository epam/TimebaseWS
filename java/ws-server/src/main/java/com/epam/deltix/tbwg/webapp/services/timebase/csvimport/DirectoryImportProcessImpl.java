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

import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportState;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportTask;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import org.springframework.util.FileSystemUtils;

import java.io.*;
import java.nio.file.Files;
import java.util.*;

public class DirectoryImportProcessImpl implements DirectoryImportProcess {

    private final static int BUFFER_SIZE = 1024 * 1024;

    private final long id;
    private final long size;
    private final File processDirectory;
    private volatile ImportTask task;
    private volatile boolean cancelled;
    private long updateTime;

    public DirectoryImportProcessImpl(File directory, String processDirectoryName, long id, long size) {
        this.id = id;
        this.size = size;
        processDirectory = createDirectory(directory, processDirectoryName);
        update();
    }

    @Override
    public boolean isRunningTask(){
        return task != null && task.getImportState() == ImportState.STARTED;
    }

    @Override
    public void updateTaskChannel(SubscriptionChannel channel) {
        if (task != null){
            task.updateChannel(channel);
        }
    }

    @Override
    public long id() {
        return id;
    }

    @Override
    public synchronized long write(InputStream is, String fileName) {
        update();
        File file = new File(processDirectory, fileName);
        try (FileOutputStream outputStream = new FileOutputStream(file, true)) {
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
        return file.length();
    }

    @Override
    public List<File> filesList() {
        update();
        List<File> files = new ArrayList<>();
        if (processDirectory != null && processDirectory.isDirectory()) {
            for (File file : Objects.requireNonNull(processDirectory.listFiles())) {
                if (!file.isDirectory()) {
                    files.add(file);
                }
            }
        }
        return files;
    }

    @Override
    public boolean ready() {
        return size == getTotalSize();
    }

    private long getTotalSize() {
        long totalSize = 0;
        File[] files = processDirectory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (!file.isDirectory() && file.exists()) {
                    totalSize += file.length();
                }
            }
        }
        return totalSize;
    }


    @Override
    public long getSize() {
        return size;
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
    public void close() {
        cancelled = true;
        if (task != null) {
            task.cancel();
        }
        if (processDirectory.exists()) {
            FileSystemUtils.deleteRecursively(processDirectory);
        }
    }

    private File createDirectory(File directory, String processDirectoryName) {
        File file = new File(directory, processDirectoryName);
        if (file.exists()) {
            if (file.isDirectory()) {
                FileSystemUtils.deleteRecursively(file);
            } else {
                file.delete();
            }
        }
        try {
            return Files.createTempDirectory(directory.toPath(), processDirectoryName).toFile();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public File getProcessDirectory() {
        return processDirectory;
    }

    @Override
    public boolean isCancelled() {
        return cancelled;
    }
}
