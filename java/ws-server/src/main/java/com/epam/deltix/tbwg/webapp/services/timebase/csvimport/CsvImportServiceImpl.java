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

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.TickDBShell;
import com.epam.deltix.tbwg.webapp.model.input.*;
import com.epam.deltix.tbwg.webapp.model.schema.DataTypeDef;
import com.epam.deltix.tbwg.webapp.model.schema.SchemaBuilder;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.*;
import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.timebase.messages.IdentityKey;
import org.apache.commons.io.ByteOrderMark;
import org.apache.commons.io.input.BOMInputStream;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import static com.epam.deltix.tbwg.webapp.utils.CsvImportUtil.*;
import static com.epam.deltix.util.lang.Util.getSimpleName;

@Service
public class CsvImportServiceImpl implements CsvImportService {

    private static final Log LOGGER = LogFactory.getLog(CsvImportServiceImpl.class);

    private final TimebaseService timebaseService;
    private final UploadFileService uploadFileService;
    private final ImportStatusService statusService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final Map<String, Map<String, Preview>> csvPreviewData = new ConcurrentHashMap<>();
    private final Map<String, Long> previewToProcessIdMapping = new HashMap<>();
    private final Map<String, CsvImportSettings> settingsMap = new HashMap<>();
    private final Map<Long, ImportProcessWriter> writers = new HashMap<>();

    public static int PREVIEW_SIZE;

    public CsvImportServiceImpl(TimebaseService timebaseService, UploadFileService uploadFileService, ImportStatusService statusService) {
        this.timebaseService = timebaseService;
        this.uploadFileService = uploadFileService;
        this.statusService = statusService;
    }

    @Override
    public String initImport() {
        String id = UUID.randomUUID().toString();
        this.csvPreviewData.put(id, new HashMap<>());
        return id;
    }

    @Override
    public void addPreview(String id, MultipartFile file, boolean fullFile) {
        Map<String, Preview> previews = getPreviewMap(id);
        generateAndAddPreview(file, previews, fullFile);
    }

    @Override
    public void removePreviews(String id, List<String> filesName) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        for (String fileName : filesName) {
            previewMap.remove(fileName);
        }
    }

    private void generateAndAddPreview(MultipartFile file, Map<String, Preview> previewMap, boolean fullFile) {
        Preview preview = new Preview();
        try (InputStream inputStream = file.getInputStream()) {
            preview.setFileName(file.getOriginalFilename());
            BOMInputStream is = new BOMInputStream(inputStream, false,
                    ByteOrderMark.UTF_8, ByteOrderMark.UTF_16BE, ByteOrderMark.UTF_16LE,
                    ByteOrderMark.UTF_32BE, ByteOrderMark.UTF_32LE);
            preview.setCharset(is.hasBOM() ? is.getBOMCharsetName() : "UTF-8");
            preview.setData(CsvImportUtil.readPreviewDataFromInputStream(is, preview.getCharset()));
            previewMap.put(preview.getFileName(), preview);
        } catch (IOException e) {
            throw new IllegalArgumentException("Can't generate preview for \"" + file.getOriginalFilename() +
                    "\" file. Reason: " + e.getMessage());
        }
        if (fullFile) {
            try (CsvLineReader reader = new CsvLineReader(new ByteArrayInputStream(file.getBytes()),
                    CsvImportUtil.determineSeparator(preview),
                    preview.getCharset(), preview.getFileName())) {
                List<String> timestampList = reader.readSingleColumnScv(DEFAULT_TIMESTAMP_COLUMN_NAME);
                if (timestampList.isEmpty()) timestampList = reader.readSingleColumnScv(DEFAULT_DATETIME_COLUMN_NAME);
                if (timestampList.size() > 1) {
                    String dateFormat = CsvImportUtil.determineDateFormat(timestampList);
                    preview.setStartAndEndTime(timestampList, dateFormat);
                }
            } catch (Exception e) {
                preview.setFullFile(false);
            }
        }
    }

    @Override
    public CsvImportSettings generateDefaultSettings(String id, String streamKey) {
        Map<String, Preview> previewMap = getPreviewMap(id);

        CsvImportSettings settings = new CsvImportSettings();
        CsvImportGeneralSettings generalSettings = new CsvImportGeneralSettings();
        generalSettings.setStreamKey(streamKey);
        try {
            Preview preview = getFirstPreviewById(id);
            generalSettings.setSeparator(CsvImportUtil.determineSeparator(preview));
        } catch (Exception e) {
            generalSettings.setSeparator(DEFAULT_SEPARATOR);
        }
        generalSettings.setCharset(CsvImportUtil.determineCharset(previewMap));

        Map<String, String> typeMappings = getTypeMappings(streamKey);
        generalSettings.setTypeToKeywordMapping(typeMappings);

        settings.setMappings(getMappings(id, generalSettings));
        try {
            String timestampHeader = getTimestampHeader(settings.getMappings());
            Preview preview = getFirstPreviewById(id);
            generalSettings.setDataTimeFormat(determineDateFormat(preview, generalSettings.getSeparator(), timestampHeader));
        } catch (Exception e) {
            generalSettings.setDataTimeFormat(DEFAULT_DATETIME_FORMAT);
        }

        generalSettings.setSymbols(getStreamSymbols(streamKey));
        if (CsvImportUtil.isAllFullFile(previewMap)) {
            generalSettings.setStartTime(Instant.ofEpochMilli(findStartTime(previewMap)));
            generalSettings.setEndTime(Instant.ofEpochMilli(findEndTime(previewMap)));
        }

        settings.setGeneralSettings(generalSettings);
        return settings;
    }

    private List<FieldToColumnMapping> getDefaultMapping(String streamKey) {
        return getStreamFieldsInfo(streamKey, null)
                .stream()
                .map(streamFieldInfo -> new FieldToColumnMapping(streamFieldInfo, null))
                .collect(Collectors.toList());
    }

    private String[] getStreamSymbols(String streamKey) {
        DXTickStream stream = getStream(streamKey);
        return Arrays.stream(stream.listEntities())
                .map(IdentityKey::getSymbol)
                .map(CharSequence::toString)
                .toArray(String[]::new);
    }

    @Override
    public List<FieldToColumnMapping> getMappings(String id, CsvImportGeneralSettings settings) {
        try {
            return getInitMappings(id, settings);
        } catch (Exception e) {
            return getDefaultMapping(settings.getStreamKey());
        }
    }

    @Override
    public List<FieldMappingValidateResponse> validateMapping(CsvImportSettings settings, String id) {
        ImportValidator validator = createImportValidator(settings, id);
        Set<String> usedTypes = settings.getGeneralSettings().getTypeToKeywordMapping().keySet();
        Set<StreamFieldInfo> usedFields = getStreamFieldsInfo(settings.getGeneralSettings().getStreamKey(), usedTypes);
        return validator.validateMapping(usedFields);
    }

    @Override
    public Map<String, FieldValidateResponse> validate(CsvImportSettings settings, String id, String fileName) {
        ImportValidator validator = createImportValidator(settings, id);
        return validator.checkConvertibility(fileName);
    }

    @Override
    public Map<String, Map<String, FieldValidateResponse>> validate(CsvImportSettings settings, String id) {
        ImportValidator validator = createImportValidator(settings, id);
        return validator.checkConvertibility();
    }

    @Override
    public List<String[]> getPreviewFileData(String id, String fileName, CsvImportSettings settings) {
        Preview preview = getPreviewMap(id).get(fileName);
        if (preview == null) {
            throw new IllegalArgumentException("Can't find preview value for \"" + fileName + "\" file.");
        }
        List<String[]> parseData = preview.getParseData(settings.getGeneralSettings().getSeparator(),
                settings.getGeneralSettings().getCharset());
        if (settings.getGeneralSettings().isGlobalSorting()) {
            return sortPreviewData(parseData, settings);
        }
        return parseData;
    }

    @Override
    public Set<String> getHeadersSet(String id, char separator, String charset) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        return previewMap.values()
                .stream()
                .map(preview -> preview.getHeaders(separator, charset))
                .flatMap(List::stream)
                .collect(Collectors.toSet());
    }

    private List<String[]> sortPreviewData(List<String[]> parseData, CsvImportSettings settings) {
        String columnName = getColumnNameByMapping(settings.getMappings(), CommonFields.TIMESTAMP.getFieldInfo());
        if (columnName != null) {
            int headerPosition = findHeaderPosition(parseData, columnName);
            if (headerPosition >= 0) {
                List<String[]> result = new ArrayList<>(parseData.size());
                result.add(parseData.get(0));
                SimpleDateFormat sdf = new SimpleDateFormat(settings.getGeneralSettings().getDataTimeFormat());
                try {
                    List<String[]> sortedValues = parseData
                            .stream()
                            .skip(settings.getGeneralSettings().getStartImportRow() - 1)
                            .sorted(Comparator.comparingLong(line -> {
                                try {
                                    return sdf.parse(line[headerPosition]).getTime();
                                } catch (ParseException e) {
                                    throw new RuntimeException(e);
                                }
                            }))
                            .collect(Collectors.toList());
                    result.addAll(sortedValues);
                } catch (Exception e) {
                    return parseData;
                }
                return result;
            }
        }
        return parseData;
    }

    @Override
    public long reserveUploadProcess(String id, long totalSize) {
        ImportProcess importProcess = uploadFileService.newDirectoryUploadProcess(totalSize);
        long processId = importProcess.id();
        previewToProcessIdMapping.put(id, processId);
        return processId;
    }

    @Override
    public long uploadChunk(long id, InputStream is, String fileName) {
        DirectoryImportProcess importProcess = getDirectoryImportProcess(id);
        if (importProcess == null) {
            throw new IllegalArgumentException("Unknown upload process id: " + id);
        }
        try {
            return importProcess.write(is, fileName);
        } catch (Throwable t) {
            LOGGER.warn().append("Upload chunk for import id '").append(id).append("' failed on file '")
                    .append(fileName).append("'").commit();
            uploadFileService.freeUpload(id);
            throw t;
        }
    }

    @Override
    public synchronized void startImport(long processId, CsvImportSettings settings, SubscriptionChannel channel) {
        DirectoryImportProcess importProcess = getDirectoryImportProcess(processId);
        if (importProcess == null) {
            ImportProcessReport importProcessReport = new ImportProcessReport(channel, processId);
            importProcessReport.sendProgress(1);
            importProcessReport.sendImportReport(statusService.getStatus(processId));
            importProcessReport.sendState(ImportState.FINISHED);
            return;
        }
        if (importProcess.isRunningTask()) {
            ImportProcessReport importProcessReport = new ImportProcessReport(channel, processId);
            importProcessReport.sendImportReport(statusService.getStatus(processId));
            importProcess.updateTaskChannel(channel);
        } else {
            ImportStatus status = statusService.newImportStatus(processId);
            ImportProcessReport report = createImportReporterWithWriter(processId, channel);
            executorService.submit(() -> {
                try {
                    ImportTask task = new ImportDirectoryTask(timebaseService, importProcess, report, settings, status);
                    importProcess.importTask(task);
                    LOGGER.info().append("Start CSV import process id: ").append(processId).commit();
                    while (!importProcess.ready()) {
                        if (task.isCancelled()) {
                            LOGGER.info().append("Finish CSV import process id: ").append(processId)
                                    .append(" Reason: cancelled.").commit();
                            return;
                        }
                        Thread.sleep(1000);
                    }
                    task.runImport();
                    if (!task.isCancelled()) {
                        freePreview(processId);
                        LOGGER.info().append("Finish CSV import process id: ").append(processId)
                                .append(" Reason: completed successfully.").commit();
                    } else {
                        LOGGER.info().append("Finish CSV import process id: ").append(processId)
                                .append(" Reason: cancelled.").commit();
                    }
                } catch (Throwable e) {
                    LOGGER.warn().append("Finish CSV import process id: ").append(processId)
                            .append(" Reason: failed by ").append(e.getMessage()).commit();
                } finally {
                    uploadFileService.freeUpload(processId);
                }
            });
        }
    }

    private ImportProcessReport createImportReporterWithWriter(long processId, SubscriptionChannel channel) {
        ImportProcessWriter writer = createWriter(processId);
        ImportProcessReport report = new ImportProcessReport(channel, processId);
        report.setWriter(writer);
        return report;
    }

    private ImportProcessWriter createWriter(long processId) {
        File logFile = uploadFileService.createLogFile(processId);
        ImportProcessWriter writer = new ImportProcessWriter(logFile);
        writers.put(processId, writer);
        return writer;
    }

    @Override
    public StreamingResponseBody getImportLog(String id) {
        long processId = getProcessId(id);
        ImportProcessWriter writer = writers.get(processId);
        File logFile = uploadFileService.getLogFile(processId);
        if (writer == null || logFile == null){
            throw new RuntimeException("Can't loading log file");
        }
        writer.close();
        if (writer.hasError()) {
            throw new RuntimeException(writer.getErrorMessage());
        }
        return outputStream -> {
            try (FileInputStream in = new FileInputStream(logFile)) {
                byte[] buffer = new byte[1024];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, len);
                }
            }
        };
    }

    @Override
    public void saveSettings(String id, CsvImportSettings settings) {
        settingsMap.put(id, settings);
    }

    @Override
    public CsvImportSettings getSettings(String id) {
        return settingsMap.get(id);
    }

    @Override
    public void cancelImport(String id) {
        Long processId = clearProcessResources(id);
        if (processId != null) {
            LOGGER.info().append("Cancel CSV import process id: ").append(processId).commit();
        }
    }

    @Nullable
    private Long clearProcessResources(String id) {
        Long processId = previewToProcessIdMapping.remove(id);
        settingsMap.remove(id);
        if (processId != null) {
            ImportProcessWriter writer = writers.get(processId);
            if (writer != null) writer.close();
            uploadFileService.freeUpload(processId);
            uploadFileService.deleteLogFile(processId);
        }
        return processId;
    }

    @Override
    public void finishImport(String id) {
        clearProcessResources(id);
        LOGGER.info().append("Finish CSV import id: ").append(id).commit();
        csvPreviewData.remove(id);
    }

    @Override
    public void checkId(String id) {
        if (!previewValuesIsPresent(id)) {
            throw new IllegalArgumentException("There are no values for this ID");
        }
    }

    private boolean previewValuesIsPresent(String id) {
        return csvPreviewData.containsKey(id);
    }

    @Override
    public long getProcessId(String id) {
        Long processId = previewToProcessIdMapping.get(id);
        if (processId == null) {
            throw new IllegalArgumentException("Import process not found for id: " + id);
        }
        return processId;
    }

    private Preview getFirstPreviewById(String id) {
        return getPreviewMap(id).values()
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Can't find preview value for " + id + " id"));
    }

    private String determineDateFormat(Preview preview, char separator, String timestampHeader) {
        try (InputStream is = new ByteArrayInputStream(preview.getData());
             CsvLineReader reader = new CsvLineReader(is, separator, preview.getCharset(), preview.getFileName())) {
            List<String> values = reader.readSingleColumnScv(timestampHeader);
            return CsvImportUtil.determineDateFormat(values);
        } catch (IOException e) {
            throw new IllegalArgumentException("Can't parse preview for " + preview.getFileName() +
                    " file. Reason: " + e.getMessage());
        }
    }

    private String getTimestampHeader(List<FieldToColumnMapping> initMappings) {
        return initMappings
                .stream()
                .filter(fieldToColumn -> fieldToColumn.getField().equals(CommonFields.TIMESTAMP.getFieldInfo()))
                .map(FieldToColumnMapping::getColumn)
                .findAny()
                .orElse("timestamp");
    }

    private List<FieldToColumnMapping> getInitMappings(String id, CsvImportGeneralSettings settings) {
        Map<String, List<String[]>> csvImportData = getPreviewParseValues(id, settings.getSeparator(), settings.getCharset());
        Set<StreamFieldInfo> usedFields = getStreamFieldsInfo(settings.getStreamKey(), settings.getTypeToKeywordMapping().keySet());
        return getStreamFieldToColumnNameMapping(usedFields, csvImportData);
    }

    private Map<String, List<String[]>> getPreviewParseValues(String id, char separator, String charset) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        Map<String, List<String[]>> result = new HashMap<>(previewMap.size());
        for (Preview preview : previewMap.values()) {
            result.put(preview.getFileName(), preview.getParseData(separator, charset));
        }
        return result;
    }

    private Map<String, Preview> getPreviewMap(String id) {
        return csvPreviewData.get(id);
    }

    private Map<String, String> getTypeMappings(String streamKey) {
        DXTickStream stream = getStream(streamKey);
        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(stream);
        Map<String, String> typeMappings = new HashMap<>();
        for (RecordClassDescriptor descriptor : descriptors) {
            typeMappings.put(descriptor.getName(), getSimpleName(descriptor.getName()));
        }
        return typeMappings;
    }

    private List<FieldToColumnMapping> getStreamFieldToColumnNameMapping(Set<StreamFieldInfo> streamFields,
                                                                         Map<String, List<String[]>> csvValues) {
        List<FieldToColumnMapping> mappings = new ArrayList<>();
        Set<String> csvColumnsName = getColumnsSet(csvValues);
        for (StreamFieldInfo streamField : streamFields) {
            String columnName = findMapping(streamField, csvColumnsName);
            mappings.add(new FieldToColumnMapping(streamField, columnName)); // columnName can be null if streamField has no mappings
        }
        setAlternateColumnMapping(mappings, csvColumnsName, CommonFields.TIMESTAMP.getFieldInfo(), DEFAULT_DATETIME_COLUMN_NAME);
        return mappings;
    }

    private static void setAlternateColumnMapping(List<FieldToColumnMapping> mappings, Set<String> csvColumnsName,
                                                  StreamFieldInfo fieldInfo, String column) {
        if (!hasMapping(mappings, fieldInfo)
                && csvColumnsName.contains(column)
                && !isMatchedColumn(mappings, column)) {
            mappings
                    .stream()
                    .filter(m -> fieldInfo.equals(m.getField()))
                    .findFirst()
                    .ifPresent(fieldToColumnMapping -> fieldToColumnMapping.setColumn(column));
        }
    }

    private static boolean isMatchedColumn(List<FieldToColumnMapping> mappings, String column) {
        return mappings
                .stream()
                .map(FieldToColumnMapping::getColumn)
                .filter(Objects::nonNull)
                .anyMatch(column::equals);
    }

    private String findMapping(StreamFieldInfo streamField, Set<String> csvColumnsName) {
        String columnName = mappingByMessageTypeAndFieldName(streamField, csvColumnsName);
        if (columnName == null) {
            columnName = mappingBySimpleName(streamField, csvColumnsName);
        }
        return columnName;
    }

    private Set<String> getColumnsSet(Map<String, List<String[]>> csvValues) {
        Set<String> headers = new HashSet<>();
        for (List<String[]> fileValues : csvValues.values()) {
            headers.addAll(List.of(getHeaders(fileValues)));
        }
        return headers;
    }

    private String[] getHeaders(List<String[]> fileValues) {
        return fileValues.get(0);
    }

    private String mappingByMessageTypeAndFieldName(StreamFieldInfo streamField, Set<String> csvColumns) {
        if (streamField.getMessageType() != null) {
            for (String columnNane : csvColumns) {
                if (columnsMatchByMessageTypeAndFieldName(columnNane, streamField)) {
                    return columnNane;
                }
            }
        }
        return null;
    }

    private String mappingBySimpleName(StreamFieldInfo streamField, Set<String> csvColumns) {
        for (String columnNane : csvColumns) {
            if (columnsMatchBySimpleName(columnNane, streamField)) {
                return columnNane;
            }
        }
        return null;
    }

    private boolean columnsMatchBySimpleName(String columnName, StreamFieldInfo streamFieldInfo) {
        return !columnName.contains(".") && columnName.equalsIgnoreCase(streamFieldInfo.getName());
    }

    private boolean columnsMatchByMessageTypeAndFieldName(String columnName, StreamFieldInfo streamFieldInfo) {
        String[] typeAndName = columnName.split("\\.");
        return typeAndName.length == 2
                && typeAndName[0].equalsIgnoreCase(getSimpleName(streamFieldInfo.getMessageType()))
                && typeAndName[1].equalsIgnoreCase(streamFieldInfo.getName());
    }

    private DirectoryImportProcess getDirectoryImportProcess(long id) {
        ImportProcess importProcess = uploadFileService.uploadProcess(id);
        if (importProcess != null && !(importProcess instanceof DirectoryImportProcess)) {
            LOGGER.warn().append("Unexpected upload process type: id=").append(id).commit();
            throw new IllegalArgumentException("Unexpected upload process type: id=" + id);
        }
        return (DirectoryImportProcess) importProcess;
    }

    private Set<StreamFieldInfo> getStreamFieldsInfo(String streamKey, Set<String> typesFilter) {
        DXTickStream stream = getStream(streamKey);
        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(stream);
        Set<StreamFieldInfo> streamFields = new HashSet<>();
        for (RecordClassDescriptor descriptor : descriptors) {
            if (typesFilter == null || typesFilter.contains(descriptor.getName())){
                addStreamFieldsInfo(descriptor, streamFields);
            }
        }
        addCommonFields(streamFields);
        return streamFields;
    }

    private void addCommonFields(Set<StreamFieldInfo> streamFields) {
        streamFields.addAll(Arrays.stream(CommonFields.values())
                .map(CommonFields::getFieldInfo)
                .collect(Collectors.toSet()));
    }

    private void addStreamFieldsInfo(RecordClassDescriptor descriptor, Set<StreamFieldInfo> streamFields) {
        RecordClassDescriptor parentDescriptor = descriptor.getParent();
        if (parentDescriptor != null) {
            addStreamFieldsInfo(parentDescriptor, streamFields);
        }

        for (DataField field : descriptor.getFields()) {
            if (field instanceof StaticDataField) continue;
            String fieldName = field.getName();
            String messagesType = descriptor.getName();
            String columnName = field.getTitle();
            DataTypeDef dataTypeDef = SchemaBuilder.getDataTypeDef(field.getType());
            streamFields.add(new StreamFieldInfo(fieldName, messagesType, columnName, dataTypeDef));
        }
    }

    private void freePreview(long processId) {
        String previewId = findIdByValue(processId);
        if (previewId != null)
            csvPreviewData.remove(previewId);
    }

    private String findIdByValue(long processId) {
        for (Map.Entry<String, Long> stringLongEntry : previewToProcessIdMapping.entrySet()) {
            if (stringLongEntry.getValue() == processId) {
                return stringLongEntry.getKey();
            }
        }
        return null;
    }

    private DXTickStream getStream(String streamName) {
        DXTickStream stream = TBWGUtils.getStream(timebaseService, streamName);
        if (stream == null) {
            throw new IllegalArgumentException(streamName + " stream not found.");
        }
        return stream;
    }

    private ImportValidator createImportValidator(CsvImportSettings settings, String id) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        DXTickStream stream = getStream(settings.getGeneralSettings().getStreamKey());
        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(stream);
        return new ImportValidatorCsv(descriptors, settings, previewMap);
    }

    @Value("${import.preview.size:50}")
    private void setPreviewSize(int previewSize) {
        PREVIEW_SIZE = previewSize;
    }
}
