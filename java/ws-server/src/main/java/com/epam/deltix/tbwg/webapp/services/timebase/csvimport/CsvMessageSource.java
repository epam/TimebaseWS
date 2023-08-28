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
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.RawMessageHelper;
import com.epam.deltix.tbwg.webapp.model.input.FieldToColumnMapping;
import com.epam.deltix.tbwg.webapp.model.input.StreamFieldInfo;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.AbortProcessException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.IllegalTypeException;
import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;
import com.epam.deltix.util.text.SimpleStringCodec;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.text.ParseException;
import java.util.*;

public class CsvMessageSource implements FileRawMessageSource {

    private final CsvLineReader reader;
    private final CsvValueConvertor convertor;
    private final CsvImportSettings settings;
    private final CsvImportGeneralSettings generalSettings;
    private final RecordClassDescriptor[] types;
    private final int typeColumnIndex;
    private final RawMessageHelper rawMessageHelper = new RawMessageHelper();
    private final String fileName;
    private final long fileSize;
    private RawMessage currentMessage;
    private boolean atEnd = false;
    private long messagesProcessed;
    private long skipMessagesCount;
    private final List<String> skipMessagesReport = new ArrayList<>();

    public CsvMessageSource(File file, CsvImportSettings settings,
                            RecordClassDescriptor[] types) throws IOException {
        this.settings = settings;
        this.types = types;
        this.fileName = file.getName();
        generalSettings = settings.getGeneralSettings();
        convertor = new CsvValueConvertor(types, generalSettings);
        this.fileSize = file.length();
        reader = new CsvLineReader(new FileInputStream(file),
                generalSettings.getSeparator(), generalSettings.getCharset(), fileName);
        typeColumnIndex = findTypeColumnIndex(settings.getMappings());
        skipLines();
    }

    private int findTypeColumnIndex(List<FieldToColumnMapping> mappings) {
        return mappings.stream()
                .filter(fieldToColumnMapping -> fieldToColumnMapping.getField().equals(CommonFields.KEYWORD.getFieldInfo()))
                .findFirst()
                .map(FieldToColumnMapping::getColumn)
                .map(reader::getHeaderIndex).orElse(-1);
    }

    private void skipLines() throws IOException {
        int startImportRow = generalSettings.getStartImportRow();
        int linesSkipp = 2;
        while (linesSkipp < startImportRow) {
            linesSkipp++;
            if (!reader.nextLine()) {
                break;
            }
        }
    }

    @Override
    public RawMessage getMessage() {
        return currentMessage;
    }

    @Override
    public boolean next() {
        try {
            while (reader.nextLine()) {
                messagesProcessed++;
                if (extractMessage()) {
                    return true;
                }
            }
            currentMessage = null;
            atEnd = true;
            return false;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean extractMessage() {
        try {
            Map<String, Object> valuesMap = createValuesMap();
            RawMessage message = new RawMessage();
            message.setSymbol(getSymbol(valuesMap));
            message.setTimeStampMs(getTimestampMs(valuesMap));
            message.type = getLineMessageType();
            rawMessageHelper.setValues(message, valuesMap);
            currentMessage = message;
            return true;
        } catch (RuntimeException | ParseException e) {
            addSkipMessageReport(e.getMessage());
            return false;
        } catch (IllegalTypeException e) {
            switch (generalSettings.getStrategy()) {
                case SKIP:
                    addSkipMessageReport(e.getMessage());
                    return false;
                case ABORT:
                    throw new AbortProcessException(e);
                default:
                    throw new IllegalArgumentException("Invalid strategy is being used");
            }
        }
    }

    private void addSkipMessageReport(String error) {
        skipMessagesCount++;
        String message = String.format("In %s file skip message (line: %s). Reason: %s",
                fileName, messagesProcessed, error);
        skipMessagesReport.add(message);
    }

    private Map<String, Object> createValuesMap() throws IllegalTypeException, ParseException {
        Map<String, Object> result = new HashMap<>();
        List<FieldToColumnMapping> mappings = settings.getMappings();
        RecordClassDescriptor messageType = getLineMessageType();
        for (FieldToColumnMapping mapping : mappings) {
            String columnName = mapping.getColumn();
            if (isFieldForConversion(messageType, mapping, columnName)) {
                StreamFieldInfo field = mapping.getField();
                String value = reader.getCurrentLineValueByHeader(columnName);
                Object converted = convertor.convertValue(field, value, messageType);
                result.put(field.getName(), converted);
            }
        }
        return result;
    }

    private boolean isFieldForConversion(RecordClassDescriptor messageType, FieldToColumnMapping mapping, String columnName) {
        return columnName != null &&
                (messageTypeHasField(messageType, mapping.getField()) || CommonFields.isCommonField(mapping.getField()));
    }

    private boolean messageTypeHasField(RecordClassDescriptor messageType, StreamFieldInfo fieldInfo) {
        return getAllMessageTypeNames(messageType).contains(fieldInfo.getMessageType())
                && messageType.getField(fieldInfo.getName()) != null;
    }

    private List<String> getAllMessageTypeNames(RecordClassDescriptor messageType) {
        List<String> result = new ArrayList<>();
        addAllMessageTypeNames(messageType, result);
        return result;
    }

    private void addAllMessageTypeNames(RecordClassDescriptor messageType, List<String> result) {
        result.add(messageType.getName());
        RecordClassDescriptor parent = messageType.getParent();
        if (parent != null) {
            addAllMessageTypeNames(parent, result);
        }
    }

    @Override
    public boolean isAtEnd() {
        return atEnd;
    }

    @Override
    public void close() {
        if (reader != null) {
            try {
                reader.close();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private RecordClassDescriptor getLineMessageType() throws IllegalTypeException {
        if (typeColumnIndex == -1) {
            return CsvImportUtil.getDefaultMessageType(types, generalSettings.getTypeToKeywordMapping());
        } else {
            String typeValue = reader.getValueByIndex(typeColumnIndex);
            return (RecordClassDescriptor) convertor.convertMessageType(typeValue);
        }
    }

//    private InstrumentType getInstrumentType(Map<String, Object> values) {
//        Object instrumentType = values.get(CommonFields.INSTRUMENT_TYPE.getFieldInfo().getName());
//        if (instrumentType instanceof InstrumentType) {
//            return (InstrumentType) instrumentType;
//        } else if (generalSettings.getInstrumentType() != null) {
//            return generalSettings.getInstrumentType()[0];
//        }
//        throw new RuntimeException("Message instrumentType is missing");
//    }

    private String getSymbol(Map<String, Object> values) {
        Object symbol = values.get(CommonFields.SYMBOL.getFieldInfo().getName());
        if (symbol instanceof String) {
            return (String) symbol;
        } else if (generalSettings.isFileBySymbol()) {
            return getSymbolFromFileName(fileName);
        }
        throw new RuntimeException("Message symbol is missing");
    }

    private long getTimestampMs(Map<String, Object> values) throws ParseException {
        Object timestamp = values.get(CommonFields.TIMESTAMP.getFieldInfo().getName());
        if (timestamp instanceof Long) {
            return (Long) timestamp;
        }
        throw new RuntimeException("Message timestamp is missing");
    }

    public long getBytesRead() {
        return reader.getNumBytesRead();
    }

    public List<String> getSkipMessagesReport() {
        ArrayList<String> result = new ArrayList<>(skipMessagesReport);
        skipMessagesReport.clear();
        return result;
    }

    public long getSkipMessagesCount() {
        return skipMessagesCount;
    }

    public long getMessagesProcessed() {
        return messagesProcessed;
    }

    public String getFileName() {
        return fileName;
    }

    public long getFileSize() {
        return fileSize;
    }

    private String getSymbolFromFileName(String fileName) {
        int i = fileName.lastIndexOf(".");
        return decodeName(fileName.substring(0, i));
    }

    private String decodeName(String name) {
        return SimpleStringCodec.DEFAULT_INSTANCE.decode(name);
    }
}
