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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.tbwg.webapp.model.input.FieldToColumnMapping;
import com.epam.deltix.tbwg.webapp.model.input.StreamFieldInfo;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.Preview;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.IllegalTypeException;
import org.jetbrains.annotations.NotNull;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import static com.epam.deltix.tbwg.webapp.services.timebase.csvimport.CsvImportServiceImpl.PREVIEW_SIZE;


public class CsvImportUtil {

    public static final char DEFAULT_SEPARATOR = ',';
    public static final String DEFAULT_DATETIME_FORMAT = "dd-MM-yyyy'T'HH:mm:ss.SSS'Z'";
    public static final String DEFAULT_TIMESTAMP_COLUMN_NAME = "timestamp";
    public static final String DEFAULT_DATETIME_COLUMN_NAME = "date/time";

    private static final Map<String, String> DATE_FORMAT_REGEXPS = new LinkedHashMap<>() {{

        put("^\\d{1,2}-\\d{1,2}-\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z$", "dd-MM-yyyy'T'HH:mm:ss'Z'");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}Z$", "yyyy-MM-dd'T'HH:mm:ss'Z'");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z$", "MM/dd/yyyy'T'HH:mm:ss'Z'");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}Z$", "yyyy/MM/dd'T'HH:mm:ss'Z'");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z$", "dd MMM yyyy'T'HH:mm:ss'Z'");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z$", "dd MMMM yyyy'T'HH:mm:ss'Z'");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}$", "dd-MM-yyyy HH:mm:ss");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}$", "yyyy-MM-dd HH:mm:ss");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}$", "MM/dd/yyyy HH:mm:ss");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}$", "yyyy/MM/dd HH:mm:ss");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}$", "dd MMM yyyy HH:mm:ss");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}$", "dd MMMM yyyy HH:mm:ss");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z$", "dd-MM-yyyy'T'HH:mm:ss.SSS'Z'");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z$", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z$", "MM/dd/yyyy'T'HH:mm:ss.SSS'Z'");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z$", "yyyy/MM/dd'T'HH:mm:ss.SSS'Z'");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z$", "dd MMM yyyy'T'HH:mm:ss.SSS'Z'");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z$", "dd MMMM yyyy'T'HH:mm:ss.SSS'Z'");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}T\\d{1,2}:\\d{2}:\\d{2}$", "dd-MM-yyyy'T'HH:mm:ss");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}$", "yyyy-MM-dd'T'HH:mm:ss");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}T\\d{1,2}:\\d{2}:\\d{2}$", "MM/dd/yyyy'T'HH:mm:ss");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}$", "yyyy/MM/dd'T'HH:mm:ss");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}$", "dd MMM yyyy'T'HH:mm:ss");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}$", "dd MMMM yyyy'T'HH:mm:ss");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "dd-MM-yyyy'T'HH:mm:ss.SSS");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "yyyy-MM-dd'T'HH:mm:ss.SSS");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "MM/dd/yyyy'T'HH:mm:ss.SSS");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "yyyy/MM/dd'T'HH:mm:ss.SSS");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "dd MMM yyyy'T'HH:mm:ss.SSS");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "dd MMMM yyyy'T'HH:mm:ss.SSS");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}\\s\\d{1,2}:\\d{2}$", "dd-MM-yyyy HH:mm");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}\\s\\d{1,2}:\\d{2}$", "yyyy-MM-dd HH:mm");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}\\s\\d{1,2}:\\d{2}$", "MM/dd/yyyy HH:mm");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}\\s\\d{1,2}:\\d{2}$", "yyyy/MM/dd HH:mm");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}\\s\\d{1,2}:\\d{2}$", "dd MMM yyyy HH:mm");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}\\s\\d{1,2}:\\d{2}$", "dd MMMM yyyy HH:mm");
        put("^\\d{14}$", "yyyyMMddHHmmss");
        put("^\\d{8}\\s\\d{6}$", "yyyyMMdd HHmmss");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "dd-MM-yyyy HH:mm:ss.SSS");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "yyyy-MM-dd HH:mm:ss.SSS");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "MM/dd/yyyy HH:mm:ss.SSS");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "yyyy/MM/dd HH:mm:ss.SSS");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "dd MMM yyyy HH:mm:ss.SSS");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}$", "dd MMMM yyyy HH:mm:ss.SSS");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}\\s[+-]{1}\\d{4}$", "dd-MM-yyyy HH:mm:ss Z");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}\\s[+-]{1}\\d{4}$", "yyyy-MM-dd HH:mm:ss Z");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}\\s[+-]{1}\\d{4}$", "MM/dd/yyyy HH:mm:ss Z");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}\\s[+-]{1}\\d{4}$", "yyyy/MM/dd HH:mm:ss Z");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}\\s[+-]{1}\\d{4}$", "dd MMM yyyy HH:mm:ss Z");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}\\s[+-]{1}\\d{4}$", "dd MMMM yyyy HH:mm:ss Z");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}\\s[+-]{1}\\d{4}$", "dd-MM-yyyy HH:mm:ss Z");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}\\s[+-]{1}\\d{4}$", "yyyy-MM-dd HH:mm:ss Z");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}\\s[+-]{1}\\d{4}$", "MM/dd/yyyy HH:mm:ss Z");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}\\s[+-]{1}\\d{4}$", "yyyy/MM/dd HH:mm:ss Z");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}\\s[+-]{1}\\d{4}$", "dd MMM yyyy HH:mm:ss Z");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}\\s\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}\\s[+-]{1}\\d{4}$", "dd MMMM yyyy HH:mm:ss Z");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z[+-]{1}\\d{4}$", "dd-MM-yyyy'T'HH:mm:ss'Z'Z");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}Z[+-]{1}\\d{4}$", "yyyy-MM-dd'T'HH:mm:ss'Z'Z");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z[+-]{1}\\d{4}$", "MM/dd/yyyy'T'HH:mm:ss'Z'Z");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}Z[+-]{1}\\d{4}$", "yyyy/MM/dd'T'HH:mm:ss'Z'Z");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z[+-]{1}\\d{4}$", "dd MMM yyyy'T'HH:mm:ss'Z'Z");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}Z[+-]{1}\\d{4}$", "dd MMMM yyyy'T'HH:mm:ss'Z'Z");

        put("^\\d{1,2}-\\d{1,2}-\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z[+-]{1}\\d{4}$", "dd-MM-yyyy'T'HH:mm:ss.SSS'Z'Z");
        put("^\\d{4}-\\d{1,2}-\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z[+-]{1}\\d{4}$", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'Z");
        put("^\\d{1,2}/\\d{1,2}/\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z[+-]{1}\\d{4}$", "MM/dd/yyyy'T'HH:mm:ss.SSS'Z'Z");
        put("^\\d{4}/\\d{1,2}/\\d{1,2}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z[+-]{1}\\d{4}$", "yyyy/MM/dd'T'HH:mm:ss.SSS'Z'Z");
        put("^\\d{1,2}\\s[A-Za-z]{3}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z[+-]{1}\\d{4}$", "dd MMM yyyy'T'HH:mm:ss.SSS'Z'Z");
        put("^\\d{1,2}\\s[A-Za-z]{4,}\\s\\d{4}T\\d{1,2}:\\d{2}:\\d{2}.\\d{1,3}Z[+-]{1}\\d{4}$", "dd MMMM yyyy'T'HH:mm:ss.SSS'Z'Z");

    }};
    private static final char[] SEPARATORS = {',', '|', '\t'};

    private static final String[] CHARSETS = {"UTF-8", "UTF-16BE", "UTF-16LE"};
    private static final String DEFAULT_CHARSET = "UTF-8";
    public static final String DEFAULT_TIMEZONE_UTC = "UTC";

    public static String determineDateFormat(List<String> dateColumn) {
        Map<String, Integer> res = new HashMap<>();
        for (String dateValue : dateColumn) {
            for (String regexp : DATE_FORMAT_REGEXPS.keySet()) {
                if (dateValue.matches(regexp)) {
                    res.merge(regexp, 1, Integer::sum);
                    break;
                }
            }
        }
        Optional<Map.Entry<String, Integer>> maxEntry = res.entrySet().stream().max(Map.Entry.comparingByValue());
        if (maxEntry.isPresent()) {
            return DATE_FORMAT_REGEXPS.get(maxEntry.get().getKey());
        } else return DEFAULT_DATETIME_FORMAT;
    }

    public static byte[] readPreviewDataFromInputStream(InputStream inputStream, String charset) throws IOException {
        StringBuilder builder = new StringBuilder();
        InputStreamReader isr = new InputStreamReader(inputStream, Charset.forName(charset));
        BufferedReader br = new BufferedReader(isr);

        int i = 0;
        for (String line = br.readLine(); line != null && i < PREVIEW_SIZE; i++, line = br.readLine()) {
            builder.append(line).append("\n");
        }
        return builder.toString().getBytes(Charset.forName(charset));
    }

    public static char determineSeparator(Preview preview) {
        Map<Character, Integer> separatorToColumnsCount = new HashMap<>(SEPARATORS.length);
        for (char separator : SEPARATORS) {
            List<String[]> valuesList = preview.getParseData(separator, preview.getCharset());
            if (isPossibleSeparator(valuesList)) {
                separatorToColumnsCount.put(separator, getHeaderLength(valuesList));
            }
        }
        Optional<Map.Entry<Character, Integer>> mostSuitableSeparator =
                separatorToColumnsCount.
                        entrySet().
                        stream().
                        max(Map.Entry.comparingByValue());
        return mostSuitableSeparator.isPresent() ? mostSuitableSeparator.get().getKey() : DEFAULT_SEPARATOR;
    }

    public static String determineCharset(Map<String, Preview> previewMap) {
        Map<String, Integer> charsetCountMap = createEmptyCharsetCountMap();
        for (Preview preview : previewMap.values()) {
            String charset = preview.getCharset();
            int count = charsetCountMap.get(charset);
            charsetCountMap.put(charset, ++count);
        }
        Optional<Map.Entry<String, Integer>> mostSuitableCharset = charsetCountMap.
                entrySet().
                stream().
                max(Map.Entry.comparingByValue());
        return mostSuitableCharset.isPresent() ? mostSuitableCharset.get().getKey() : DEFAULT_CHARSET;
    }

    public static boolean isAllFullFile(Map<String, Preview> previewMap) {
        return previewMap.values().stream().allMatch(Preview::isFullFile);
    }

    public static long findStartTime(Map<String, Preview> previewMap) {
        return previewMap.values().stream().mapToLong(Preview::getStartTime).min().orElse(0);
    }

    public static long findEndTime(Map<String, Preview> previewMap) {
        return previewMap.values().stream().mapToLong(Preview::getEndTime).max().orElse(0);
    }

    public static long findMaxTimestampInMs(List<String> timestampList, String dateFormat) throws ParseException {
        final SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
        sdf.setTimeZone(TimeZone.getTimeZone(DEFAULT_TIMEZONE_UTC));
        boolean seen = false;
        long best = Long.MIN_VALUE;
        for (String s : timestampList) {
            Date parse = sdf.parse(s);
            long time = parse.getTime();
            if (!seen || time > best) {
                seen = true;
                best = time;
            }
        }
        return seen ? best : 0L;
    }

    public static long findMinTimestampInMs(List<String> timestampList, String dateFormat) throws ParseException {
        final SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
        sdf.setTimeZone(TimeZone.getTimeZone(DEFAULT_TIMEZONE_UTC));
        boolean seen = false;
        long best = Long.MAX_VALUE;
        for (String s : timestampList) {
            Date parse = sdf.parse(s);
            long time = parse.getTime();
            if (!seen || time < best) {
                seen = true;
                best = time;
            }
        }
        return seen ? best : 0L;
    }

    public static boolean hasMapping(List<FieldToColumnMapping> mappings, StreamFieldInfo field) {
        for (FieldToColumnMapping mapping : mappings) {
            if (field.equals(mapping.getField())) {
                return mapping.getColumn() != null;
            }
        }
        return false;
    }

    public static String getColumnNameByMapping(List<FieldToColumnMapping> mappings, StreamFieldInfo field) {
        for (FieldToColumnMapping mapping : mappings) {
            if (field.equals(mapping.getField())) {
                return mapping.getColumn();
            }
        }
        return null;
    }

    public static RecordClassDescriptor getDefaultMessageType(RecordClassDescriptor[] types, Map<String, String> typeToKeywordMapping) throws IllegalTypeException {
        if (types != null && typeToKeywordMapping != null && typeToKeywordMapping.size() == 1) {
            for (RecordClassDescriptor type : types) {
                String defaultType = typeToKeywordMapping.keySet().stream().findFirst().get();
                if (type.getName().equals(defaultType)) {
                    return type;
                }
            }
        }
        throw new IllegalTypeException("Undefined object type.");
    }

    public static int findHeaderPosition(List<String[]> values, String name) {
        String[] headers = values.get(0);
        for (int i = 0; i < headers.length; i++) {
            if (headers[i].equals(name))
                return i;
        }
        return -1;
    }

    @NotNull
    private static Map<String, Integer> createEmptyCharsetCountMap() {
        Map<String, Integer> charsetCountMap = new HashMap<>();
        for (String charset : CHARSETS) {
            charsetCountMap.put(charset, 0);
        }
        return charsetCountMap;
    }

    private static boolean isPossibleSeparator(List<String[]> valuesList) {
        int headerLength = getHeaderLength(valuesList);
        if (headerLength < 2) return false;
        return valuesList.stream().noneMatch(values -> values.length != headerLength);
    }

    private static int getHeaderLength(List<String[]> valuesList) {
        return valuesList.get(0).length;
    }

    public static boolean messageTypeHasField(RecordClassDescriptor messageType, StreamFieldInfo fieldInfo) {
        return getAllMessageTypeNames(messageType).contains(fieldInfo.getMessageType())
                && messageType.getField(fieldInfo.getName()) != null;
    }

    private static List<String> getAllMessageTypeNames(RecordClassDescriptor messageType) {
        List<String> result = new ArrayList<>();
        addAllMessageTypeNames(messageType, result);
        return result;
    }

    private static void addAllMessageTypeNames(RecordClassDescriptor messageType, List<String> result) {
        result.add(messageType.getName());
        RecordClassDescriptor parent = messageType.getParent();
        if (parent != null) {
            addAllMessageTypeNames(parent, result);
        }
    }
}
