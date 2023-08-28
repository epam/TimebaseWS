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

import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;
import lombok.Getter;
import lombok.Setter;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.text.ParseException;
import java.util.Arrays;
import java.util.List;

@Getter
@Setter
public class Preview {

    private String fileName;
    private byte[] data;
    private String charset;
    private boolean fullFile;
    private long startTime;
    private long endTime;

    public List<String[]> getParseData(char separator, String charset) {
        try (InputStream is = new ByteArrayInputStream(data);
             CsvLineReader reader = new CsvLineReader(is, separator, charset, fileName)) {
            return reader.getPreviewValues();
        } catch (Exception e) {
            throw new IllegalArgumentException("Can't parse preview for \"" + fileName +
                    "\" file with separator: '" + separator + "' and charset: '" + charset +
                    "'. Reason: " + e.getMessage());
        }
    }
    public List<String> getHeaders(char separator, String charset) {
        try (InputStream is = new ByteArrayInputStream(data);
             CsvLineReader reader = new CsvLineReader(is, separator, charset, fileName)) {
            return Arrays.asList(reader.getHeaders());
        } catch (Exception e) {
            throw new IllegalArgumentException("Can't parse preview for \"" + fileName +
                    "\" file with separator: '" + separator + "' and charset: '" + charset +
                    "'. Reason: " + e.getMessage());
        }
    }

    public void setStartAndEndTime(List<String> timestampList, String dateFormat) {
        try {
            long maxTimestampInMs = CsvImportUtil.findMaxTimestampInMs(timestampList, dateFormat);
            if (maxTimestampInMs != Long.MAX_VALUE) {
                endTime = maxTimestampInMs;
                fullFile = true;
            }
            startTime = CsvImportUtil.findMinTimestampInMs(timestampList, dateFormat);
        } catch (ParseException e) {
            fullFile = false;
        }
    }
}
