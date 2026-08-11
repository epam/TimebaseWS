/*
 * Copyright 2024 EPAM Systems, Inc
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
import com.epam.deltix.qsrv.hf.pub.md.json.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.TickDBShell;
import com.epam.deltix.tbwg.webapp.model.input.*;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.*;
import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.tbwg.webapp.utils.VersionUtils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.util.time.TimeKeeper;
import org.apache.commons.io.ByteOrderMark;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static com.epam.deltix.tbwg.webapp.utils.CsvImportUtil.*;
import static com.epam.deltix.util.lang.Util.getSimpleName;

@Service
public class CsvImportServiceImpl implements CsvImportService {

    private static final Log LOGGER = LogFactory.getLog(CsvImportServiceImpl.class);
    public static final int IMPORT_FINISH_DELAY = 60_000;

    private final TimebaseRegistry registry;
    private final UploadFileService uploadFileService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final Map<String, CsvImportData> importDataMap = new ConcurrentHashMap<>();

    public static int PREVIEW_SIZE;

    public CsvImportServiceImpl(TimebaseRegistry registry, UploadFileService uploadFileService) {
        this.registry = registry;
        this.uploadFileService = uploadFileService;
    }

    @Override
    public String initImport(String streamKey, String tbId) {
        String id = UUID.randomUUID().toString();
        importDataMap.put(id, new CsvImportData(id, streamKey, tbId));
        return id;
    }

    @Override
    public void addPreview(String id, MultipartFile file, boolean fullFile) {
        Map<String, Preview> previews = getPreviewMap(id);
        String filename = file.getOriginalFilename();
        try (InputStream inputStream = file.getInputStream()) {
            Preview preview = generatePreview(inputStream, filename);
            if (fullFile) {
                determineTimestampParamForPreview(preview, file.getBytes());
            }
            previews.put(filename, preview);
        } catch (IOException e) {
            throw new IllegalArgumentException("Can't generate preview for \"" + file.getOriginalFilename() +
                    "\" file. Reason: " + e.getMessage());
        }
    }

    @Override
    public void removePreviews(String id, List<String> filesName) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        for (String fileName : filesName) {
            previewMap.remove(fileName);
        }
    }

    private Preview generatePreview(InputStream inputStream, String fileName) throws IOException {
        Preview preview = new Preview();
        preview.setFileName(fileName);
        BOMInputStream is = new BOMInputStream(inputStream, false,
                ByteOrderMark.UTF_8, ByteOrderMark.UTF_16BE, ByteOrderMark.UTF_16LE,
                ByteOrderMark.UTF_32BE, ByteOrderMark.UTF_32LE);
        preview.setCharset(is.hasBOM() ? is.getBOMCharsetName() : "UTF-8");
        preview.setData(CsvImportUtil.readPreviewDataFromInputStream(is, preview.getCharset()));
        return preview;
    }

    private void determineTimestampParamForPreview(Preview preview, byte[] data) {
        try (CsvLineReader reader = new CsvLineReader(new ByteArrayInputStream(data), CsvImportUtil.determineSeparator(preview),
                preview.getCharset(), preview.getFileName())) {
            List<String> timestampList = reader.readSingleColumnScv(DEFAULT_TIMESTAMP_COLUMN_NAME);
            if (timestampList.isEmpty()) timestampList = reader.readSingleColumnScv(DEFAULT_DATETIME_COLUMN_NAME);
            if (timestampList.size() > 1) {
                preview.setStartAndEndTime(timestampList);
            }
        } catch (Exception e) {
            preview.setFullFile(false);
        }
    }

    @Override
    public CsvImportSettings generateDefaultSettings(String id, String streamKey) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        String tbId = getImportById(id).getTbId();

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

        Map<String, String> typeMappings = getTypeMappings(streamKey, tbId);
        generalSettings.setTypeToKeywordMapping(typeMappings);

        settings.setMappings(getMappings(id, generalSettings));
        try {
            String timestampHeader = getTimestampHeader(settings.getMappings());
            Preview preview = getFirstPreviewById(id);
            setDateFormat(preview, generalSettings, timestampHeader);
        } catch (Exception e) {
            generalSettings.setDataTimeFormat(DEFAULT_DATETIME_FORMAT);
        }

        generalSettings.setSymbols(getStreamSymbols(streamKey, tbId));
        if (CsvImportUtil.isAllFullFile(previewMap)) {
            generalSettings.setStartTime(Instant.ofEpochMilli(findStartTime(previewMap)));
            generalSettings.setEndTime(Instant.ofEpochMilli(findEndTime(previewMap)));
        }

        settings.setGeneralSettings(generalSettings);
        return settings;
    }

    @Override
    public SchemaDef generateSchema(String id, boolean enumCheck, int enumValuesCount, int enumRepeatRate, boolean staticCheck) {
        long processId = getProcessId(id);
        Map<String, Preview> previews = getPreviewMap(id);
        DirectoryImportProcess importProcess = getDirectoryImportProcess(processId);

        int i = 0;
        while (!importProcess.ready()) {
            if (i == 5) {
                throw new IllegalArgumentException("Files for process \"" + processId + "\" not loaded");
            }
            i++;
            TimeKeeper.parkNanos(1_000_000_000);
        }

        // generate previews
        List<File> files = importProcess.filesList();
        for (File file : files) {
            try (FileInputStream inputStream = new FileInputStream(file)) {
                previews.put(file.getName(), generatePreview(inputStream, file.getName()));
            } catch (IOException e) {
                throw new IllegalArgumentException("Can't generate preview for \"" + file.getName() +
                        "\" file. Reason: " + e.getMessage());
            }
        }

        // generate general settings
        Preview preview = getFirstPreviewById(id);
        CsvImportGeneralSettings generalSettings = new CsvImportGeneralSettings();
        try {
            generalSettings.setSeparator(CsvImportUtil.determineSeparator(preview));
        } catch (Exception e) {
            generalSettings.setSeparator(DEFAULT_SEPARATOR);
        }
        generalSettings.setCharset(CsvImportUtil.determineCharset(previews));
        Set<String> headersSet = getHeadersSet(id, generalSettings.getSeparator(), generalSettings.getCharset());
        try {
            String timestampHeader = headersSet.contains(DEFAULT_TIMESTAMP_COLUMN_NAME) ? DEFAULT_TIMESTAMP_COLUMN_NAME : DEFAULT_DATETIME_COLUMN_NAME;
            setDateFormat(preview, generalSettings, timestampHeader);
        } catch (Exception e) {
            generalSettings.setDataTimeFormat(DEFAULT_DATETIME_FORMAT);
        }

        // generate schema
        String tbId = getImportById(id).getTbId();
        CsvSchemaParser csvSchemaParser = new CsvSchemaParser(generalSettings, enumCheck, enumValuesCount,
                enumRepeatRate, staticCheck, !VersionUtils.versionHasNsEncoding(registry.resolve(tbId).getServerVersion()));
        for (File file : importProcess.filesList()) {
            csvSchemaParser.processFile(file);
        }
        return csvSchemaParser.getSchema();
    }

    private List<FieldToColumnMapping> getDefaultMapping(String streamKey, String tbId) {
        return getStreamFieldsInfo(streamKey, null, tbId)
                .stream()
                .map(streamFieldInfo -> new FieldToColumnMapping(streamFieldInfo, null))
                .collect(Collectors.toList());
    }

    private String[] getStreamSymbols(String streamKey, String tbId) {
        DXTickStream stream = getStream(streamKey, tbId);
        return Arrays.stream(stream.listEntities())
                .map(IdentityKey::getSymbol)
                .map(CharSequence::toString)
                .toArray(String[]::new);
    }

    @Override
    public List<FieldToColumnMapping> getMappings(String id, CsvImportGeneralSettings settings) {
        String tbId = getImportById(id).getTbId();
        try {
            return getInitMappings(id, settings, tbId);
        } catch (Exception e) {
            return getDefaultMapping(settings.getStreamKey(), tbId);
        }
    }

    @Override
    public List<FieldMappingValidateResponse> validateMapping(CsvImportSettings settings, String id) {
        String tbId = getImportById(id).getTbId();
        ImportValidator validator = createImportValidator(settings, id);
        Set<String> usedTypes = settings.getGeneralSettings().getTypeToKeywordMapping().keySet();
        Set<StreamFieldInfo> usedFields = getStreamFieldsInfo(settings.getGeneralSettings().getStreamKey(), usedTypes, tbId);
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
        getImportById(id).setProcessId(processId);
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
    public synchronized void startImport(String id, SubscriptionChannel channel) {
        CsvImportData importData = getImportById(id);
        long processId = importData.getProcessId();
        CsvImportSettings settings = importData.getSetting();
        if (settings == null || processId == -1) {
            throw new IllegalArgumentException("Import metadata not found for id: " + id);
        }
        DirectoryImportProcess importProcess = getDirectoryImportProcess(processId);
        if (importProcess == null) {
            ImportProcessReport importProcessReport = new ImportProcessReport(channel, processId);
            importProcessReport.sendProgress(1);
            importProcessReport.sendImportReport(importData.getImportStatus());
            importProcessReport.sendState(ImportState.FINISHED);
            return;
        }
        if (importProcess.isRunningTask()) {
            ImportProcessReport importProcessReport = new ImportProcessReport(channel, processId);
            importProcessReport.sendImportReport(importData.getImportStatus());
            importProcess.updateTaskChannel(channel);
        } else {
            ImportStatus status = new ImportStatus(processId);
            importData.setImportStatus(status);
            ImportProcessReport report = createImportReporterWithWriter(processId, channel);
            executorService.submit(() -> {
                try {
                    String tbId = importData.getTbId();
                    ImportTask task = new ImportDirectoryTask(
                        registry.resolve(tbId),
                        importProcess, report, settings, status);
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
                            .append(" Reason: failed by ").append(e).commit();
                    report.sendError("CSV import process failed with error: " + e.getMessage());
                } finally {
                    uploadFileService.freeUpload(processId);
                }
            });
        }
    }

    @Override
    public void setActiveImport(String id) {
        CsvImportData importData = getImportById(id);
        importData.setActive(true);
    }

    @Override
    public void inactiveImport(String id) {
        finishIfNotActiveWithDelay(id);
    }

    private void finishIfNotActiveWithDelay(String id) {
        CsvImportData importData;
        try {
            importData = getImportById(id);
        } catch (IllegalArgumentException e) {
            return;
        }
        importData.setActive(false);
        new Thread(() -> {
            try {
                Thread.sleep(IMPORT_FINISH_DELAY);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            if (!importData.isActive()) {
                finishImport(id);
            }
        }).start();
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
        CsvImportData importData = findImportByProcessId(processId);
        if (importData == null) {
            throw new IllegalArgumentException("Import not found for current process");
        }
        importData.setWriter(writer);
        return writer;
    }

    @Override
    public StreamingResponseBody getImportLog(String id) {
        CsvImportData importData = getImportById(id);
        ImportProcessWriter writer = importData.getWriter();
        File logFile = uploadFileService.getLogFile(importData.getProcessId());
        if (writer == null || logFile == null) {
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

    private CsvImportData getImportById(String id) {
        CsvImportData csvImportData = importDataMap.get(id);
        if (csvImportData == null) {
            throw new IllegalArgumentException("There are no import data for ID: " + id);
        }
        return csvImportData;
    }

    @Override
    public void saveSettings(String id, CsvImportSettings settings) {
        CsvImportData importData = getImportById(id);
        if (!importData.getStreamKey().equals(settings.getGeneralSettings().getStreamKey())){
            throw new IllegalArgumentException("The stream key does not match the one passed during import initialization");
        }
        importData.setSetting(settings);
    }

    @Override
    public void cancelImport(String id) {
        long processId = clearProcessResources(id);
        if (processId != -1) {
            LOGGER.info().append("Cancel CSV import process id: ").append(processId).commit();
        }
    }

    private long clearProcessResources(String id) {
        CsvImportData importData = getImportById(id);
        long processId = importData.getProcessId();
        if (importData.clearProcessResources()) {
            uploadFileService.freeUpload(processId);
            uploadFileService.deleteLogFile(processId);
        }
        return processId;
    }

    @Override
    public void finishImport(String id) {
        clearProcessResources(id);
        LOGGER.info().append("Finish CSV import id: ").append(id).commit();
        importDataMap.remove(id);
    }

    @Override
    public void checkId(String id) {
        if (!isActiveImport(id)) {
            throw new IllegalArgumentException("There are no values for this ID");
        }
    }

    private boolean isActiveImport(String id) {
        return importDataMap.containsKey(id);
    }

    @Override
    public long getProcessId(String id) {
        long processId = getImportById(id).getProcessId();
        if (processId == -1) {
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

    private void setDateFormat(Preview preview, CsvImportGeneralSettings settings, String timestampHeader) {
        try (InputStream is = new ByteArrayInputStream(preview.getData());
             CsvLineReader reader = new CsvLineReader(is, settings.getSeparator(), preview.getCharset(), preview.getFileName())) {
            List<String> values = reader.readSingleColumnScv(timestampHeader);
            boolean nanoTime = isNanoTimeValues(values);
            if (nanoTime) {
                settings.setDataTimeFormat(determineNanoDateFormat(values));
            } else {
                settings.setDataTimeFormat(determineDateFormat(values));
            }
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

    private List<FieldToColumnMapping> getInitMappings(String id, CsvImportGeneralSettings settings, String tbId) {
        Map<String, List<String[]>> csvImportData = getPreviewParseValues(id, settings.getSeparator(), settings.getCharset());
        Set<StreamFieldInfo> usedFields = getStreamFieldsInfo(settings.getStreamKey(), settings.getTypeToKeywordMapping().keySet(), tbId);
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
        return getImportById(id).getCsvPreviewData();
    }

    private Map<String, String> getTypeMappings(String streamKey, String tbId) {
        DXTickStream stream = getStream(streamKey, tbId);
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

    private Set<StreamFieldInfo> getStreamFieldsInfo(String streamKey, Set<String> typesFilter, String tbId) {
        DXTickStream stream = getStream(streamKey, tbId);
        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(stream);
        Set<StreamFieldInfo> streamFields = new HashSet<>();
        for (RecordClassDescriptor descriptor : descriptors) {
            if (typesFilter == null || typesFilter.contains(descriptor.getName())) {
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
        CsvImportData importData = findImportByProcessId(processId);
        if (importData != null)
            importData.getCsvPreviewData().clear();
    }

    private CsvImportData findImportByProcessId(long processId) {
        for (CsvImportData importData : importDataMap.values()) {
            if (importData.getProcessId() == processId) {
                return importData;
            }
        }
        return null;
    }

    private DXTickStream getStream(String streamName, String tbId) {
        DXTickStream stream = TBWGUtils.getStream(registry.resolve(tbId), streamName);
        if (stream == null) {
            throw new IllegalArgumentException(streamName + " stream not found.");
        }
        return stream;
    }

    private ImportValidator createImportValidator(CsvImportSettings settings, String id) {
        Map<String, Preview> previewMap = getPreviewMap(id);
        String tbId = getImportById(id).getTbId();
        DXTickStream stream = getStream(settings.getGeneralSettings().getStreamKey(), tbId);
        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(stream);
        return new ImportValidatorCsv(descriptors, settings, previewMap);
    }

    @Value("${import.preview.size:50}")
    private void setPreviewSize(int previewSize) {
        PREVIEW_SIZE = previewSize;
    }
}