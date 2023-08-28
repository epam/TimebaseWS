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

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.stream.MessageReader2;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;

public class FileRawMessageReader implements FileRawMessageSource {

    private final MessageReader2 delegate;
    private final String fileName;
    private final long fileSize;
    private final long skipMessagesCount;
    private final long messagesProcessed;

    public FileRawMessageReader(FileInputStream inputStream, long fileSize, String fileName, long skipMessagesCount, long messagesProcessed) throws IOException {
        this.skipMessagesCount = skipMessagesCount;
        this.messagesProcessed = messagesProcessed;
        delegate = new MessageReader2(inputStream, fileSize, true, 8192, null);
        this.fileName = fileName;
        this.fileSize = fileSize;
    }

    @Override
    public RawMessage getMessage() {
        Object message = delegate.getMessage();
        if (message instanceof RawMessage) {
            return (RawMessage) message;
        }
        return null;
    }

    @Override
    public boolean next() {
        return delegate.next();
    }

    @Override
    public boolean isAtEnd() {
        return delegate.isAtEnd();
    }

    @Override
    public void close() {
        delegate.close();
    }

    @Override
    public String getFileName() {
        return fileName;
    }

    @Override
    public long getFileSize() {
        return fileSize;
    }

    @Override
    public long getSkipMessagesCount() {
        return skipMessagesCount;
    }

    @Override
    public long getMessagesProcessed() {
        return messagesProcessed;
    }

    @Override
    public List<String> getSkipMessagesReport() {
        return null;
    }

    @Override
    public long getBytesRead() {
        return (long) (delegate.getProgress() >= 0 ? (delegate.getProgress() * (double) fileSize) : 0);
    }
}
