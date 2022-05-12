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
package com.epam.deltix.tbwg.webapp.services.timebase.export;

import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickStream;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.util.collections.CharSequenceSet;
import com.epam.deltix.util.text.SimpleStringCodec;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public abstract class StreamExporter implements FileResponseBody {
    protected final AtomicLong exportProcesses;
    protected final ExportSourceFactory sourceFactory;
    protected final ExportRequest request;
    protected final long fromTimestamp;
    protected final long toTimestamp;
    protected final long startIndex; // inclusive
    protected final long endIndex; // inclusive
    protected final TickStream[] streams;
    protected final RecordClassDescriptor[] descriptors;
    protected final String fileName;

    StreamExporter(AtomicLong exportProcesses,
                   String fileName, ExportSourceFactory sourceFactory, ExportRequest request,
                   long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                   RecordClassDescriptor[] descriptors)
    {
        this.exportProcesses = exportProcesses;
        this.fileName = fileName;
        this.sourceFactory = sourceFactory;
        this.request = request;
        this.fromTimestamp = fromTimestamp;
        this.toTimestamp = toTimestamp;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.streams = sourceFactory instanceof StreamsExportSourceFactory ?
            ((StreamsExportSourceFactory) sourceFactory).getStreams() : new TickStream[0];
        this.descriptors = descriptors;
    }

    @Override
    public String getFileName() {
        return fileName;
    }

    protected List<String> getSymbols() {
        if (request.symbols != null) {
            return Arrays.asList(request.symbols);
        } else {
            return Arrays.asList(getStreamsSymbols());
        }
    }

    protected Set<String> getSpaces() {
        Set<String> spaces = new HashSet<>();
        for (TickStream stream : streams) {
            spaces.addAll(Arrays.asList(stream.listSpaces()));
        }

        return spaces;
    }

    private String[] getStreamsSymbols() {
        CharSequenceSet set = new CharSequenceSet();
        for (TickStream stream : streams) {
            IdentityKey[] identities = stream.listEntities();
            for (IdentityKey identity : identities) {
                set.addCharSequence(identity.getSymbol());
            }
        }

        return set.toArray(new String[0]);
    }

    protected <T> void exportByKey(Supplier<Collection<T>> keysProvider, ExportByKeys<T> exporter) throws IOException {
        Set<T> exportedKeys = new HashSet<>();
        List<T> keysToExport;
        do {
            keysToExport = keysProvider.get().stream()
                .filter(s -> !exportedKeys.contains(s))
                .collect(Collectors.toList());
            exporter.accept(keysToExport);
            exportedKeys.addAll(keysToExport);
        } while (keysToExport.size() > 0);
    }

    protected String encodeName(String name) {
        return SimpleStringCodec.DEFAULT_INSTANCE.encode(name);
    }

}
