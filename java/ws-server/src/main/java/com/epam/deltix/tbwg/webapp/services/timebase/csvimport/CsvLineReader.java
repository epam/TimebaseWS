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

import com.epam.deltix.util.csvx.CSVXReader;
import com.epam.deltix.util.io.ByteCountingInputStream;
import org.apache.commons.io.ByteOrderMark;
import org.apache.commons.io.input.BOMInputStream;

import java.io.*;
import java.nio.charset.Charset;
import java.util.*;

import static com.epam.deltix.tbwg.webapp.services.timebase.csvimport.CsvImportServiceImpl.PREVIEW_SIZE;

public class CsvLineReader implements Closeable {

    private final CSVXReader delegate;
    private ByteCountingInputStream bcis;

    public CsvLineReader(InputStream inputStream, char separator, String charsetName, String fileName) throws IOException {
        this(inputStream, separator, charsetName, fileName, true);
    }

    public CsvLineReader(InputStream inputStream, char separator, String charsetName, String fileName, boolean closeReader) throws IOException {
        delegate = createReader(inputStream, separator, charsetName, fileName, closeReader);
        delegate.readHeaders(true);
    }

    private CSVXReader createReader(InputStream inputStream, char separator, String charsetName, String fileName, boolean closeReader) throws IOException {
        return new CSVXReader(warpToEncodeReade(inputStream, charsetName), separator, closeReader, fileName);
    }

    private Reader warpToEncodeReade(InputStream inputStream, String charsetName) throws IOException {
        BOMInputStream is = new BOMInputStream(inputStream, false,
                ByteOrderMark.UTF_8, ByteOrderMark.UTF_16BE, ByteOrderMark.UTF_16LE, ByteOrderMark.UTF_32BE, ByteOrderMark.UTF_32LE);
        if (charsetName == null) {
            charsetName = is.hasBOM() ? is.getBOMCharsetName() : "UTF-8";
        }
        bcis = new ByteCountingInputStream(is);
        return new InputStreamReader(bcis, Charset.forName(charsetName));
    }

    public List<String[]> getPreviewValues() {
        List<String[]> valuesList = new ArrayList<>();
        valuesList.add(delegate.getHeaders());
        for (int i = 0; i < PREVIEW_SIZE; i++) {
            try {
                String[] line = readLine();
                if (line == null) break;
                valuesList.add(line);
            } catch (IOException e) {}
        }
        return valuesList;
    }

    public List<String> readSingleColumnScv(String columnName) {
        final List<String> result = new ArrayList<>();
        int columnIndex = delegate.getHeaderIndex(columnName);
        if (columnIndex == -1) return result;
        try {
            while (delegate.nextLine()) {
                final String value = delegate.getCell(columnIndex, true).toString();
                result.add(value);
            }
        } catch (IOException e) {}
        return result;
    }

    public boolean nextLine() throws IOException {
        return delegate.nextLine();
    }

    public String[] readLine() throws IOException {
        if (delegate.nextLine()) {
            return delegate.getCells();
        }
        return null;
    }

    public int getHeaderIndex(String columnName) {
        return delegate.getHeaderIndex(columnName);
    }

    public String getCurrentLineValueByHeader(String columnName) {
        return delegate.getCell(delegate.getHeaderIndex(columnName)).toString();
    }

    public String getValueByIndex(int index) {
        return delegate.getCell(index).toString();
    }

    public String[] getHeaders() {
        return delegate.getHeaders();
    }

    public long getNumBytesRead() {
        return bcis.getNumBytesRead();
    }

    @Override
    public void close() throws IOException {
        if (bcis != null && delegate.getCloseReader()) {
            bcis.close();
        }
        if (delegate != null) {
            delegate.close();
        }
    }
}
