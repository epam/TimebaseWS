package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.stream.MessageReader2;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;

import com.epam.deltix.qsrv.util.json.DataEncoding;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.qsrv.util.json.PrintType;
import com.epam.deltix.tbwg.webapp.Application;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.CsvImportSettings;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.CsvMessageSource;
import com.epam.deltix.tbwg.webapp.services.timebase.export.CSVExporter;
import com.epam.deltix.tbwg.webapp.services.timebase.export.StreamsExportSourceFactory;
import com.epam.deltix.tbwg.webapp.utils.CsvLineWriter;
import com.epam.deltix.util.csvx.CSVXReader;
import com.epam.deltix.util.io.CSVWriter;
import com.epam.deltix.util.time.Periodicity;
import com.google.gson.Gson;
import lombok.SneakyThrows;
import org.apache.commons.io.IOUtils;
import org.jetbrains.annotations.NotNull;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.*;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.ZipInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;


@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles({"testFlowchart", "withTb", "timebaseExternal"})
@Testcontainers
public class ExportImportTest {

    public static final String SOURCE_STREAM_KEY = UUID.randomUUID().toString();
    public static final String TARGET_STREAM_KEY = UUID.randomUUID().toString();
    public static final String IMPORT_SETTING_JSON_FILENAME = "import/setting.json";
    public static final String GZ_IMPORT_FILE_NAME = "import/AllTypesMessage.qsmsg.gz";
    private static final Gson jsonParser = new Gson();
    private static final LoadingOptions loadingOptions = LoadingOptions.withRewriteMode(true);
    private static final SelectionOptions selectionOptions = new SelectionOptions();
    private static final String NANOTIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS'Z'";
    private final JSONRawMessagePrinter printer =
            new JSONRawMessagePrinter(true, true, DataEncoding.STANDARD, false,
                    false, PrintType.FULL, true, "$type");
    @Autowired
    private TimebaseService timebaseService;


    @BeforeClass
    public static void beforeClass() throws Throwable {
        loadingOptions.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;
        selectionOptions.raw = true;
    }

    @SneakyThrows
    @Test
    public void csvLineWriter() {
        var reader = createReader(GZ_IMPORT_FILE_NAME);
        RecordClassDescriptor[] streamTypes = reader.getTypes();
        DXTickStream sourceStream = createStream(streamTypes, SOURCE_STREAM_KEY);
        try {
            loadStreamFromQsmsg(reader, sourceStream);

            ExportRequest request = new ExportRequest();
            StringWriter source = new StringWriter();
            CsvLineWriter sourceLineWriter = new CsvLineWriter(new CSVWriter(source), request, streamTypes);
            sourceLineWriter.writeHeader();

            TickCursor sourceCursor = sourceStream.select(Long.MIN_VALUE, selectionOptions);
            File csvExportZipArc = exportStream(sourceStream);
            File unzipFile = getUnzipFile(csvExportZipArc);
            try (CSVXReader targetSource = new CSVXReader(new InputStreamReader(new FileInputStream(unzipFile), StandardCharsets.UTF_8),
                    ',', true, unzipFile.getName())) {
                targetSource.readHeaders();
                while (sourceCursor.next()) {
                    targetSource.nextLine();
                    String targetLine = targetSource.getLine();
                    RawMessage sourceMessage = (RawMessage) sourceCursor.getMessage();
                    source.getBuffer().setLength(0);
                    sourceLineWriter.writeLine(sourceMessage);
                    assertEquals(source.getBuffer().toString(), targetLine);
                }
                if (targetSource.nextLine()) throw new RuntimeException("Not equal number of lines");
            } finally {
                unzipFile.delete();
            }
        } finally {
            sourceStream.delete();
            reader.close();
        }
    }


    @SneakyThrows
    @Test
    public void csvExportImport() {
        MessageReader2 reader = createReader(GZ_IMPORT_FILE_NAME);
        RecordClassDescriptor[] streamTypes = reader.getTypes();
        DXTickStream sourceStream = createStream(streamTypes, SOURCE_STREAM_KEY);
        DXTickStream targetStream = createStream(streamTypes, TARGET_STREAM_KEY);
        try {
            loadStreamFromQsmsg(reader, sourceStream);

            sourceStream = timebaseService.getStream(SOURCE_STREAM_KEY);
            File csvExportZipArc = exportStream(sourceStream);
            File unzipFile = getUnzipFile(csvExportZipArc);
            importStream(streamTypes, targetStream, unzipFile);

            try {

                TickCursor targetCursor = targetStream.select(Long.MIN_VALUE, selectionOptions);
                TickCursor sourceCursor = sourceStream.select(Long.MIN_VALUE, selectionOptions);
                StringBuilder ssb = new StringBuilder();
                StringBuilder tsb = new StringBuilder();
                while (true) {
                    if (targetCursor.next()) {
                        if (sourceCursor.next()) {
                            RawMessage targetMessage = (RawMessage) targetCursor.getMessage();
                            RawMessage sourceMessage = (RawMessage) sourceCursor.getMessage();
                            tsb.setLength(0);
                            ssb.setLength(0);
                            printer.append(targetMessage, tsb);
                            printer.append(sourceMessage, ssb);
                            assertEquals(ssb.toString(), tsb.toString());
                        } else assert false : "sourceStream ended before targetStream";
                    } else if (sourceCursor.next()) {
                        assert false : "targetStream ended before sourceStream";
                    } else {
                        break;
                    }
                }
            } finally {
                unzipFile.delete();
            }
        } finally {
            targetStream.delete();
            sourceStream.delete();
            reader.close();
        }
    }

    @SneakyThrows
    @Test
    public void csvExportImportNanoTime() {
        MessageReader2 reader = createReader(GZ_IMPORT_FILE_NAME);
        RecordClassDescriptor[] streamTypes = reader.getTypes();
        DXTickStream targetStream = createStream(streamTypes, SOURCE_STREAM_KEY);
        URL resource = getClass().getClassLoader().getResource("import/nanoStream.csv");
        File expected = new File(Objects.requireNonNull(resource).toURI());

        try {
            importStream(streamTypes, targetStream, expected, true);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        File file = exportStream(targetStream, true);
        File actual = getUnzipFile(file);
        try (CSVXReader targetSource = new CSVXReader(new InputStreamReader(new FileInputStream(actual), StandardCharsets.UTF_8),
                ',', true, actual.getName());
             CSVXReader source = new CSVXReader(new InputStreamReader(new FileInputStream(expected), StandardCharsets.UTF_8),
                     ',', true, expected.getName());) {
            targetSource.readHeaders();
            source.readHeaders();
            while (source.nextLine()) {
                targetSource.nextLine();
                String targetLine = targetSource.getLine();
                String sourceLine = source.getLine();
                assertEquals(sourceLine, targetLine);
            }
        } finally {
            reader.close();
            targetStream.delete();
            actual.delete();
            file.delete();
        }

    }

    @NotNull
    private MessageReader2 createReader(String fileName) throws URISyntaxException, IOException {
        File sourceFile = new File(
                Objects.requireNonNull(ExportImportTest.class.getClassLoader().getResource(fileName)).toURI());
        return new MessageReader2(
                new FileInputStream(sourceFile), sourceFile.length(), true, 1 << 20, null);
    }

    private void importStream(RecordClassDescriptor[] streamTypes, DXTickStream targetStream, File unzipFile) throws URISyntaxException, IOException {
        importStream(streamTypes, targetStream, unzipFile, false);
    }

    private void importStream(RecordClassDescriptor[] streamTypes, DXTickStream targetStream, File unzipFile, boolean nanoTime) throws URISyntaxException, IOException {
        URL resource = getClass().getClassLoader().getResource(IMPORT_SETTING_JSON_FILENAME);
        File settingFile = new File(Objects.requireNonNull(resource).toURI());
        BufferedReader bufferedReader = Files.newBufferedReader(settingFile.toPath());
        CsvImportSettings settings = jsonParser.fromJson(bufferedReader, CsvImportSettings.class);
        if (nanoTime) {
            settings.getGeneralSettings().setDataTimeFormat(NANOTIME_FORMAT);
        }

        settings.getGeneralSettings().setStreamKey(targetStream.getKey());

        CsvMessageSource source = new CsvMessageSource(unzipFile, settings, streamTypes);

        TickLoader targetLoader = targetStream.createLoader(loadingOptions);
        while (source.next()) {
            targetLoader.send(source.getMessage());
        }
    }

    @NotNull
    private static File getUnzipFile(File csvExportZipArc) throws IOException {
        ZipInputStream zipInputStream = new ZipInputStream(new FileInputStream(csvExportZipArc));
        zipInputStream.getNextEntry();
        File unzipFile = Files.createTempFile(null, TARGET_STREAM_KEY + ".csv").toFile();
        unzipFile.deleteOnExit();
        IOUtils.copy(zipInputStream, new FileOutputStream(unzipFile));
        csvExportZipArc.delete();
        return unzipFile;
    }

    private File exportStream(DXTickStream sourceStream) throws IOException {
        return exportStream(sourceStream, false);
    }

    @NotNull
    private File exportStream(DXTickStream sourceStream, boolean nanoTime) throws IOException {
        ExportRequest request = new ExportRequest();
        if (nanoTime) {
            request.datetimeFormat = NANOTIME_FORMAT;
        }
        long startTime = request.getStartTime(0);
        long endTime = request.getEndTime();

        String[] types = new String[]{"deltix.qsrv.test.messages.AllSimpleTypesMessage",
                "deltix.qsrv.test.messages.AllTypesMessage"
        };
        StreamsExportSourceFactory streamsExportSourceFactory =
                new StreamsExportSourceFactory(timebaseService, 0, selectionOptions, new TickStream[]{sourceStream}, types, null);

        CSVExporter csvExporter = new CSVExporter(new AtomicLong(),
                SOURCE_STREAM_KEY, streamsExportSourceFactory, request, startTime, endTime, 0, -1, sourceStream.getTypes()
        );

        File f = Files.createTempFile(null, SOURCE_STREAM_KEY + ".zip").toFile();
        f.deleteOnExit();
        try {
            csvExporter.writeTo(new FileOutputStream(f));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return f;
    }

    private static void loadStreamFromQsmsg(MessageReader2 reader, DXTickStream sourceStream) {
        TickLoader loader = sourceStream.createLoader(loadingOptions);
        while (reader.next()) {
            loader.send(reader.getMessage());
        }
    }

    private DXTickStream createStream(RecordClassDescriptor[] types, String streamKey) {
        DXTickDB db = timebaseService.getConnection();
        DXTickStream sourceStream = db.getStream(streamKey);

        if (sourceStream != null) sourceStream.delete();
        StreamOptions streamOptions = new StreamOptions();
        streamOptions.setPolymorphic(types);
        streamOptions.name = streamKey;
        streamOptions.periodicity = Periodicity.mkIrregular();
        sourceStream = db.createStream(streamKey, streamOptions);
        return sourceStream;
    }

}
