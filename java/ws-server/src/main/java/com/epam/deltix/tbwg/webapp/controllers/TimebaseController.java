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
package com.epam.deltix.tbwg.webapp.controllers;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.gflog.api.LogLevel;
import com.epam.deltix.tbwg.webapp.Application;
import com.epam.deltix.tbwg.webapp.model.*;
import com.epam.deltix.tbwg.webapp.model.input.*;
import com.epam.deltix.tbwg.webapp.model.schema.*;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.*;
import com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService;
import com.epam.deltix.tbwg.webapp.services.timebase.export.FileResponseBody;
import com.epam.deltix.tbwg.webapp.services.timebase.export.QueryExportSourceFactory;
import com.epam.deltix.tbwg.webapp.services.timebase.export.StreamsExportSourceFactory;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentKey;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.fasterxml.jackson.core.io.JsonStringEncoder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.epam.deltix.qsrv.hf.pub.*;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.client.Version;
import com.epam.deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import com.epam.deltix.qsrv.hf.tickdb.lang.pub.Token;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.TickDBShell;
import com.epam.deltix.qsrv.util.json.JSONRawMessageParser;

import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.model.filter.FilterFactory;
import com.epam.deltix.tbwg.webapp.model.orderbook.L2PackageDto;
import com.epam.deltix.tbwg.webapp.model.qql.FunctionDef;
import com.epam.deltix.tbwg.webapp.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.webapp.model.smd.CurrencyDef;
import com.epam.deltix.tbwg.webapp.model.smd.InstrumentDef;
import com.epam.deltix.tbwg.webapp.services.InstrumentsService;
import com.epam.deltix.tbwg.webapp.services.OptionsService;
import com.epam.deltix.tbwg.webapp.services.orderbook.OrderBookDebugger;
import com.epam.deltix.tbwg.webapp.services.orderbook.OrderBookSnapshotRequest;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.base.SchemaManipulationService;
import com.epam.deltix.tbwg.webapp.services.timebase.base.SelectService;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportService;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportSettings;
import com.epam.deltix.tbwg.webapp.utils.MessageSource2ResponseStream;
import com.epam.deltix.tbwg.webapp.utils.ObjectMappingUtils;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.tbwg.webapp.utils.TextUtils;
import com.epam.deltix.tbwg.webapp.utils.qql.SelectBuilder;
import com.epam.deltix.util.lang.StringUtils;
import com.epam.deltix.util.parsers.CompilationException;
import com.epam.deltix.util.time.GMT;
import com.epam.deltix.util.time.Interval;
import com.epam.deltix.util.time.Periodicity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.validation.Valid;
import java.io.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;
import static com.epam.deltix.tbwg.webapp.utils.TBWGUtils.*;
import static com.epam.deltix.tbwg.webapp.utils.TimeBaseUtils.getEndTime;

/**
 * Default controller for REST API
 */
@RestController
@RequestMapping("/api/v0")
@CrossOrigin
public class TimebaseController {

    static final int MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET;

    static {
        int maxNumberOfRecords;
        try {
            maxNumberOfRecords = Integer.parseInt(System.getProperty("deltix.tbwg.webapp.services.maxRecordSetSize", "10000"));
        } catch (NumberFormatException ex) {
            maxNumberOfRecords = 10000;
        }
        MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET = maxNumberOfRecords;
    }

    final String[] EMPTY_LIST = new String[0];

    private static final Log LOGGER = LogFactory.getLog(TimebaseController.class);

    private final TimebaseService service;
    private final SchemaManipulationService schemaManipulationService;
    private final SelectService selectService;
    private final InstrumentsService instrumentsService;
    private final ExportService exportService;
    private final ImportService importService;
    private final OptionsService optionsService;
    private final OrderBookDebugger orderBookDebugger;

    private final AtomicLong idGenerator = new AtomicLong(System.currentTimeMillis());

    @Autowired
    public TimebaseController(TimebaseService service, SchemaManipulationService schemaManipulationService,
                              SelectService selectService, InstrumentsService instrumentsService,
                              ExportService exportService, ImportService importService,
                              OptionsService optionsService, OrderBookDebugger orderBookDebugger) {
        this.service = service;
        this.schemaManipulationService = schemaManipulationService;
        this.selectService = selectService;
        this.instrumentsService = instrumentsService;
        this.exportService = exportService;
        this.importService = importService;
        this.optionsService = optionsService;
        this.orderBookDebugger = orderBookDebugger;
    }

    @RequestMapping(value = {"/v", "/"}, method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public VersionDef version() {
        return new VersionDef("Timebase Web Gateway", Application.VERSION, System.currentTimeMillis(),
                new VersionDef.TimeBase(Version.getVersion(), service.getServerVersion(), service.isConnected()), true);
    }

    @RequestMapping(value = {"/correlationId"}, method = RequestMethod.GET)
    @ResponseBody
    public long correlationId() {
        return idGenerator.incrementAndGet();
    }

    /**
     * <p>Returns data from the specified streams, according to the specified options. The messages
     * are returned from the cursor strictly ordered by time. Within the same
     * exact timestamp, the order of messages is undefined and may vary from
     * call to call, i.e. it is non-deterministic.</p>
     *
     * <p>Note that the arguments of this method only determine the initial
     * configuration of the cursor.</p>
     *
     * @param select selection options
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/select", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> select(@Valid @RequestBody(required = false) SelectRequest select)
            throws NoStreamsException {
        if (select == null) {
            select = new SelectRequest();
        }
        return ResponseEntity.ok()
                .body(selectService.select(select, MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET));
    }

    /**
     * <p>Returns data from the specified streams, according to the specified options. The messages
     * are returned from the cursor strictly ordered by time. Within the same
     * exact timestamp, the order of messages is undefined and may vary from
     * call to call, i.e. it is non-deterministic.</p>
     *
     * <p>Note that the arguments of this method only determine the initial
     * configuration of the cursor.</p>
     *
     * @param streams Specified streams to be subscribed
     * @param symbols Specified instruments (symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     * @param types   Specified message types to be subscribed. If undefined, then all types will be subscribed.
     * @param depth   Specified time depth to look back in case when 'start time' is undefined.
     * @param from    Query start time
     * @param to      Query end time
     * @param offset  Start row offset. (By default = 0)
     * @param rows    Number of returning rows. (By default = 1000)
     * @param reverse Result direction of messages according to timestamp
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/select", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> select(
            @RequestParam String[] streams,
            @RequestParam(required = false) String[] symbols,
            @RequestParam(required = false) String[] types,
            @RequestParam(required = false) String depth,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Long offset,
            @RequestParam(required = false) Integer rows,
            @RequestParam(required = false) String space,
            @RequestParam(required = false) boolean reverse) throws NoStreamsException {
        SelectRequest request = new SelectRequest();
        request.streams = streams;
        request.symbols = symbols;
        request.types = types;
        request.from = from;
        request.to = to;
        if (rows != null)
            request.rows = rows;
        request.offset = offset != null ? offset : 0;
        request.reverse = reverse;
        request.depth = depth;
        request.space = space;
        return select(request);
    }

    /**
     * <p>Returns data from this specified stream, according to the specified options. The messages
     * are returned from the cursor strictly ordered by time. Within the same
     * exact timestamp, the order of messages is undefined and may vary from
     * call to call, i.e. it is non-deterministic.</p>
     *
     * <p>Note that the arguments of this method only determine the initial
     * configuration of the cursor.</p>
     *
     * @param streamId stream key
     * @param select   selection options
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/select", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> select(@PathVariable String streamId,
                                                        @Valid @RequestBody(required = false) StreamRequest select)
            throws NoStreamsException {
        if (select == null)
            select = new StreamRequest();

        return select(streamId, select.symbols, select.types, null, select.from, select.to, select.offset,
                select.rows, select.space, select.reverse);
    }

    /**
     * <p>Returns data from this specified stream, according to the specified options. The messages
     * are returned from the cursor strictly ordered by time. Within the same
     * exact timestamp, the order of messages is undefined and may vary from
     * call to call, i.e. it is non-deterministic.</p>
     *
     * <p>Note that the arguments of this method only determine the initial
     * configuration of the cursor.</p>
     *
     * @param streamId Specified stream to be subscribed
     * @param symbols  Specified instruments(symbols) to be subscribed. If undefined, then all instruments will be subscribed.
     * @param types    Specified message types to be subscribed. If undefined, then all types will be subscribed.
     * @param depth    Specified time depth to look back in case when 'start time' is undefined.
     * @param from     Query start time
     * @param to       Query end time
     * @param offset   Start row offset.
     * @param rows     Number of returning rows.
     * @param reverse  Result direction of messages according to timestamp
     * @return List of rows
     * @pathExample /GDAX/select?from=2018-06-28T00:51:05.297Z&amp;to=2018-06-28T23:59:59.999Z
     * @pathExample /GDAX/select?from=2018-06-28T00:00:00.000Z&amp;to=2018-06-28T23:59:59.999Z&amp;offset=100000
     * @pathExample /GDAX/select?from=2018-06-28T00:00:00.000Z&amp;symbols=BTCEUR,ETHEUR
     * @pathExample /GDAX/select?from=2018-06-28T00:00:00.000Z&amp;types=deltix.timebase.api.messages.TradeMessage
     * @pathExample /GDAX/select?offset=10000&amp;rows=5000
     * @pathExample /GDAX/select?depth=3H
     * @responseExample application/json {"symbol":"BCHEUR","timestamp":"2018-06-28T00:51:05.297Z","currencyCode":999,"entries":[{"type":"L2EntryUpdate","exchangeId":"GDAX","price":624.809999999,"size":0.02305503,"action":"DELETE","level":3,"side":"ASK"},{"type":"L2EntryNew","exchangeId":"GDAX","price":626.7,"size":0.6850108,"level":19,"side":"ASK"}],"packageType":"INCREMENTAL_UPDATE"}
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/select", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> select(
            @PathVariable String streamId,
            @RequestParam(required = false) String[] symbols,
            @RequestParam(required = false) String[] types,
            @RequestParam(required = false) String depth,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Long offset,
            @RequestParam(required = false) Integer rows,
            @RequestParam(required = false) String space,
            @RequestParam(required = false) boolean reverse) throws NoStreamsException {
        if (TextUtils.isEmpty(streamId))
            throw new NoStreamsException();

        return select(new String[]{streamId}, symbols, types, depth, from, to, offset, rows, space, reverse);
    }

    // download operation is permitted for any user
//    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/download", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> download(@RequestParam(required = true) String id) {
        StreamingResponseBody body = exportService.getExportBody(id);

        if (body != null) {
            String fileName = "download.zip";
            if (body instanceof FileResponseBody) {
                fileName = ((FileResponseBody) body).getFileName();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment;filename=" + fileName)
                    .body(body);
        }

        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/export", method = {RequestMethod.POST})
    public ResponseEntity<DownloadId> export(@Valid @RequestBody(required = false) ExportStreamsRequest select)
            throws NoStreamsException {
        if (select == null)
            select = new ExportStreamsRequest();

        if (select.streams == null)
            throw new NoStreamsException();

        ArrayList<DXTickStream> streams = new ArrayList<>();
        for (String streamId : select.streams) {
            DXTickStream stream = service.getStream(streamId);
            if (stream != null)
                streams.add(stream);
        }

        if (streams.isEmpty())
            throw new NoStreamsException(select.streams);;

        HashSet<IdentityKey> instruments = null;

        if (select.symbols != null) {
            instruments = new HashSet<>();

            for (DXTickStream stream : streams)
                Collections.addAll(instruments, match(stream, select.symbols));
        }

        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = select.reverse;
        options.raw = true;

        final long startIndex = select.offset < 0 ? 0 : select.offset;
        final long endIndex = select.rows < 0 ? -1 : startIndex + select.rows - 1; // inclusive

        DXTickStream[] tickStreams = streams.toArray(new DXTickStream[streams.size()]);

        long startTime = select.getStartTime(getEndTime(tickStreams));

        IdentityKey[] ids = collect(instruments);

        Interval periodicity = streams.size() == 1 ? streams.get(0).getPeriodicity().getInterval() : null;

        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(streams.toArray(new TickStream[streams.size()]));

        LOGGER.log(LogLevel.INFO, "EXPORT * FROM " + Arrays.toString(select.streams) + " WHERE MESSAGE_INDEX IN [" + startIndex + ", " + endIndex + "] " +
                "AND TYPES = [" + Arrays.toString(select.getTypes()) + "] AND ENTITIES = [" + Arrays.toString(ids) + "] " +
                "AND timestamp [" + GMT.formatDateTimeMillis(startTime) + ":" + GMT.formatDateTimeMillis(select.getEndTime()) + "]");

        return ResponseEntity.ok(new DownloadId(
            exportService.prepareExport(
                new StreamsExportSourceFactory(service, startTime, options, tickStreams, select.getTypes(), ids),
                select, startTime, select.getEndTime(), startIndex, endIndex, periodicity, select.convertNamespaces, descriptors
            )
        ));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/export", method = {RequestMethod.GET})
    public ResponseEntity<DownloadId> export(
            @RequestParam String[] streams,
            @RequestParam(required = false) String[] symbols,
            @RequestParam(required = false) String[] types,
            @RequestParam(required = false) String depth,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false, defaultValue = "0") long offset,
            @RequestParam(required = false, defaultValue = "-1") int rows,
            @RequestParam(required = false) boolean reverse) throws NoStreamsException {

        ExportStreamsRequest request = new ExportStreamsRequest();
        request.streams = streams;
        request.symbols = symbols;
        request.setTypes(types);
        request.from = from;
        request.to = to;
        request.rows = rows;
        request.offset = offset;
        request.reverse = reverse;

        return export(request);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/export", method = RequestMethod.POST)
    public ResponseEntity<DownloadId> export(@PathVariable String streamId, @Valid @RequestBody(required = false) ExportRequest select)
            throws UnknownStreamException {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        if (select == null)
            select = new ExportRequest();

        IdentityKey[] ids = match(stream, select.symbols);

        SelectionOptions options = getSelectionOption(select);

        final long startIndex = select.offset < 0 ? 0 : select.offset;
        final long endIndex = select.rows < 0 ? -1 : startIndex + select.rows - 1; // inclusive

        long startTime = select.getStartTime(getEndTime(stream));

        Interval periodicity = stream.getPeriodicity().getInterval();

        return ResponseEntity.ok(new DownloadId(
            exportService.prepareExport(
                new StreamsExportSourceFactory(service, startTime, options, new DXTickStream[]{stream}, select.getTypes(), ids),
                select, startTime, select.getEndTime(), startIndex, endIndex, periodicity,
                select.convertNamespaces, stream.getTypes()
            )
        ));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/export", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<DownloadId> export(
            @PathVariable String streamId,
            @RequestParam(required = false) String[] symbols,
            @RequestParam(required = false) String[] types,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false, defaultValue = "0") long offset,
            @RequestParam(required = false, defaultValue = "-1") int rows,
            @RequestParam(required = false) boolean reverse) throws NoStreamsException, UnknownStreamException {
        if (TextUtils.isEmpty(streamId))
            throw new NoStreamsException();

        ExportRequest request = new ExportRequest();

        request.from = from;
        request.offset = offset;
        request.to = to;
        request.rows = rows;
        request.reverse = reverse;
        request.setTypes(types);
        request.symbols = symbols;

        return export(streamId, request);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/export-query", method = {RequestMethod.POST})
    public ResponseEntity<DownloadId> exportQuery(@Valid @RequestBody(required = false) QueryRequest query)
        throws InvalidQueryException
    {
        if (query == null || StringUtils.isEmpty(query.query)) {
            throw new InvalidQueryException(query == null ? "" : query.query);
        }

        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.raw = true;

        ExportRequest request = new ExportRequest();
        request.format = query.format != null ? query.format : ExportFormat.QSMSG;

        ClassSet classSet = service.getConnection().describeQuery(query.query, options);
        ClassDescriptor[] descriptors = classSet.getContentClasses();

        RecordClassDescriptor[] rcds = Arrays.stream(descriptors)
                .filter(RecordClassDescriptor.class::isInstance)
                .map(RecordClassDescriptor.class::cast)
                .toArray(RecordClassDescriptor[]::new);

        LOGGER.log(LogLevel.INFO, "EXPORT * FROM QUERY(" + query.query + ")");

        return ResponseEntity.ok(new DownloadId(
            exportService.prepareExport(
                new QueryExportSourceFactory(service, options, query.query),
                request, Long.MIN_VALUE, Long.MAX_VALUE, 0, -1, null, false, rcds
            )
        ));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/startImport", method = {RequestMethod.POST})
    public long startImport(@Valid @RequestBody ImportRequest importRequest) {
        return importService.startImport(
            importRequest.fileName, importRequest.fileSize,
            new ImportSettings(
                importRequest.stream, importRequest.description,
                importRequest.symbols, null,
                importRequest.from != null ? importRequest.from.toEpochMilli() : Long.MIN_VALUE,
                importRequest.to != null ? importRequest.to.toEpochMilli() : Long.MAX_VALUE,
                getPeriodicity(importRequest.periodicity)
            )
        );
    }

    private Periodicity getPeriodicity(PeriodicityRequest periodicityRequest) {
        Periodicity periodicity = Periodicity.mkIrregular();
        if (periodicityRequest != null) {
            if (periodicityRequest.type == Periodicity.Type.STATIC) {
                periodicity = Periodicity.mkStatic();
            } else if (periodicityRequest.type == Periodicity.Type.REGULAR) {
                periodicity = Periodicity.mkRegular(
                    Interval.create(periodicityRequest.value, periodicityRequest.unit)
                );
            }
        }

        return periodicity;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/importChunk/{id}", method = {RequestMethod.POST})
    public void importMessages(@PathVariable long id,
                               @RequestParam MultipartFile file,
                               @RequestParam long offset) throws IOException
    {
        importService.uploadChunk(id, file.getInputStream(), offset, file.getSize());
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/cancelImport/{id}", method = {RequestMethod.POST})
    public void importCancel(@PathVariable long id) {
        importService.cancelImport(id);
    }

    /**
     * Stream DDL description.
     *
     * @param streamId stream key
     * @return json object that contains DDL description. See {@link DescribeResponse}.
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/describe", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DescribeResponse> describeStream(@PathVariable String streamId) throws UnknownStreamException {
        return ResponseEntity.ok(schemaManipulationService.describeStream(streamId));
    }

    /**
     * Stream spaces list
     *
     * @param streamId stream key
     * @return list of stream spaces. Empty list, if stream contains no spaces.
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/spaces", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> listSpaces(@PathVariable String streamId, @RequestParam(required = false, defaultValue = "") String filter)
            throws UnknownStreamException {

        LOGGER.log(LogLevel.INFO, "GET [%s].listSpaces(filter = %s)").with(streamId).with(filter);

        if (TextUtils.isEmpty(streamId))
            throw new UnknownStreamException(streamId);

        DXTickStream stream = service.getStreamChecked(streamId);
        String[] spaces = stream != null ? stream.listSpaces() : EMPTY_LIST;

        if (spaces != null) {
            Arrays.sort(spaces);
            String lower = filter.toLowerCase();

            return ResponseEntity.ok(Arrays.stream(spaces).filter(z -> z.toLowerCase().contains(lower)).toArray());
        }

        return ResponseEntity.ok(EMPTY_LIST);
    }

    /**
     * <p>Purge selected stream, e.g. delete data earlier that given time</p>
     *
     * @param streamId stream key
     * @param request  Time measured in milliseconds that passed since January 1, 1970 UTC.
     * @return Any errors occurred while parsing and writing data
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/purge", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> purge(@PathVariable String streamId, @RequestBody(required = true) SimpleRequest request) throws UnknownStreamException {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Purge stream [" + streamId + "] Failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        LOGGER.log(LogLevel.INFO, "PURGE [" + streamId + "] to " + request.timestamp);

        stream.purge(request.timestamp);

        return ResponseEntity.ok().build();
    }

    /**
     * <p>Deletes selected stream</p>
     *
     * @param streamId stream key
     * @return Any errors occurred while parsing and writing data
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/delete", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> delete(@PathVariable String streamId)
            throws UnknownStreamException {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Delete stream [" + streamId + "] Failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        stream.delete();

        return ResponseEntity.ok().build();
    }

    /**
     * <p>Rename selected stream.</p>
     *
     * @param streamId    stream key
     * @param newStreamId new stream key
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/rename", method = RequestMethod.POST, headers = "Content-Type=multipart/form-data",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> renameStream(@PathVariable String streamId, @RequestParam String newStreamId)
            throws UnknownStreamException {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Rename stream [" + streamId + "] Failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        stream.rename(newStreamId);
        stream.setName(newStreamId);

        return ResponseEntity.ok().build();
    }

    /**
     * <p>Rename selected symbols in stream.</p>
     *
     * @param streamId  stream key
     * @param symbol    symbol key
     * @param newSymbol new symbol key
     * @return status 404 if stream or symbol not found.
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/{symbol}/rename", method = RequestMethod.POST, headers = "Content-Type=multipart/form-data",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> renameSymbol(@PathVariable String streamId, @PathVariable String symbol,
                                          @RequestParam String newSymbol) throws UnknownStreamException {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Rename stream [" + streamId + "] Failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        IdentityKey[] identities = Arrays.stream(stream.listEntities())
                .filter(i -> i.getSymbol().toString().equals(symbol))
                .toArray(IdentityKey[]::new);

        if (identities.length == 0) {
            return ResponseEntity.notFound().build();
        }

        stream.renameInstruments(identities, Arrays.stream(identities).map(
                id -> new InstrumentKey(newSymbol)
        ).toArray(IdentityKey[]::new));

        return ResponseEntity.ok().build();
    }

    /**
     * <p>Rename given space in the stream.</p>
     *
     * @param streamId stream key
     * @param space    Space name to rename
     * @param newName  New space name
     * @return status 404 if stream or symbol not found.
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/renameSpace", method = RequestMethod.GET,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> renameSpace(@PathVariable String streamId, @RequestParam String space,
                                         @RequestParam String newName) throws UnknownStreamException {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Rename stream [" + streamId + "] Failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        stream.renameSpace(newName, space);
        return ResponseEntity.ok().build();
    }

    /**
     * <p>Delete given space in the stream.</p>
     *
     * @param streamId stream key
     * @param space    Space(partition) name
     * @return status 404 if stream or space not found.
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/deleteSpace", method = RequestMethod.GET,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteSpace(@PathVariable String streamId, @RequestParam String space)
            throws UnknownStreamException {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Delete stream [" + streamId + "] space [" + space + "] failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        stream.deleteSpaces(space);

        return ResponseEntity.ok().build();
    }

    /**
     * <p>Change periodicity of a stream.</p>
     *
     * @param streamId stream key
     * @param periodicity Periodicity
     * @return status 404 if stream or space not found.
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/setPeriodicity", method = RequestMethod.POST,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> setPeriodicity(@PathVariable String streamId, @RequestParam String periodicity)
        throws UnknownStreamException
    {
        ResponseEntity<StreamingResponseBody> entity = checkWritable("Change periodicity of stream [" + streamId + "] failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        stream.setPeriodicity(Periodicity.parse(periodicity));

        return ResponseEntity.ok().build();
    }

    /**
     * <p>Truncates selected stream, e.g. delete data older that given time</p>
     *
     * @param streamId stream key
     * @param request  Time measured in milliseconds that passed since January 1, 1970 UTC and List if Symbols.
     * @return Any errors occurred while parsing and writing data
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/truncate", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> truncate(@PathVariable String streamId, @RequestBody(required = true) SimpleRequest request,
                                      OutputStream outputStream) throws UnknownStreamException {

        ResponseEntity<StreamingResponseBody> entity = checkWritable("Truncate stream [" + streamId + "] Failed");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        long timestamp = request.timestamp;
        LOGGER.log(LogLevel.INFO, "TRUNCATE [" + streamId + "] to " + request.timestamp);

        if (request.symbols != null && request.symbols.length > 0) {
            HashSet<IdentityKey> instruments = new HashSet<>();
            Collections.addAll(instruments, match(stream, request.symbols));

            stream.truncate(timestamp, instruments.toArray(new IdentityKey[instruments.size()]));
        } else {
            stream.truncate(timestamp);
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }

    /**
     * <p>Writes messages into the stream. Messages should ordered by 'timestamp' or without 'timestamp' field.</p>
     * if timestamp field is not specified, current server time will be used.
     *
     * @param streamId stream key
     * @param messages messages in JSON format
     * @return Any errors occurred while parsing and writing data
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/write", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> write(@PathVariable String streamId,
                                                       @RequestParam(required = false, defaultValue = "APPEND") LoadingOptions.WriteMode writeMode,
                                                       @RequestBody String messages) throws UnknownStreamException {

        ResponseEntity<StreamingResponseBody> entity = checkWritable("Write failed.");
        if (entity != null)
            return entity;

        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        JsonArray array = (JsonArray) new JsonParser().parse(messages);
        JSONRawMessageParser parser = new JSONRawMessageParser(stream.getTypes(), "$type");

        int count = 0;
        ErrorWriter listener = new ErrorWriter();
        LoadingOptions options = new LoadingOptions(true);
        options.writeMode = writeMode;
        try (TickLoader loader = stream.createLoader(options)) {

            loader.addEventListener(listener);
            for (int i = 0; i < array.size(); i++) {
                JsonElement msg = array.get(i);

                try {
                    RawMessage raw = parser.parse((JsonObject) msg);
                    loader.send(raw);
                    count++;
                } catch (Exception e) {
                    listener.onError(new LoadingError("Message is invalid:" + msg.toString().replace("\"", "'"), e));
                }
            }

            LOGGER.log(LogLevel.INFO, "WRITE [" + streamId + "] " + count + " messages.");
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON_UTF8)
                .body(listener);
    }

    ResponseEntity<StreamingResponseBody> checkWritable(String error) {
        if (service.isReadonly()) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(outputStream -> {
                try (OutputStreamWriter writer = new OutputStreamWriter(outputStream)) {
                    writer.write("{\"message\": \"Timebase connection is read-only\", \"error\"=\"" + error + "\"} ");
                }
            });
        }

        return null;
    }

    /**
     * <p>Returns data from this specified stream, according to the specified options. The messages
     * are returned from the cursor strictly ordered by time. Within the same
     * exact timestamp, the order of messages is undefined and may vary from
     * call to call, i.e. it is non-deterministic.</p>
     *
     * <p>Note that the arguments of this method only determine the initial
     * configuration of the cursor.</p>
     *
     * @param streamId stream key
     * @param symbolId symbol key
     * @param select   selection options
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/{symbolId}/select", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> select(@PathVariable String streamId, @PathVariable String symbolId,
                                                        @Valid @RequestBody(required = false) InstrumentRequest select,
                                                        OutputStream outputStream) {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            //noinspection unchecked
            return new ResponseEntity(HttpStatus.NOT_FOUND);

        if (select == null)
            select = new InstrumentRequest();

        IdentityKey[] ids = match(stream, symbolId);

        SelectionOptions options = getSelectionOption(select);

        final long startIndex = select.offset < 0 ? 0 : select.offset;
        final long endIndex = startIndex + select.rows - 1; // inclusive

        long startTime = select.getStartTime(getEndTime(stream));

        LOGGER.log(LogLevel.INFO, "SELECT * FROM " + streamId + " WHERE MESSAGE_INDEX IN [" + startIndex + ", " + endIndex + "] " +
                "AND TYPES = [" + Arrays.toString(select.types) + "] AND ENTITIES = [" + Arrays.toString(ids) + "] " +
                (options.spaces != null ? "AND SPACES = " + Arrays.toString(options.spaces) : "") +
                "AND timestamp [" + GMT.formatDateTimeMillis(startTime) + ":" + GMT.formatDateTimeMillis(select.getEndTime()) + "]");


        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new MessageSource2ResponseStream(
                        stream.select(startTime, options, select.types, ids), select.getEndTime(), startIndex, endIndex,
                        MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET)
                );
    }

    /**
     * <p>Returns data from this specified stream, according to the selection options. The messages
     * are returned from the cursor strictly ordered by time. Within the same
     * exact timestamp, the order of messages is undefined and may vary from
     * call to call, i.e. it is non-deterministic.</p>
     *
     * <p>Note that the arguments of this method only determine the initial
     * configuration of the cursor.</p>
     *
     * @param streamId stream key
     * @param symbolId Specified symbol to be subscribed.
     * @param types    Specified message types to be subscribed. If undefined, then all types will be subscribed.
     * @param depth    Specified time depth to look back in case when 'start time' is undefined.
     * @param from     Query start time.
     * @param to       Query end time.
     * @param offset   Start row offset.
     * @param rows     Number of returning rows.
     * @param reverse  Result direction of messages according to timestamp
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/{symbolId}/select", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> select(
            @PathVariable String streamId,
            @PathVariable String symbolId,
            @RequestParam(required = false) String[] types,
            @RequestParam(required = false) String depth,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Long offset,
            @RequestParam(required = false) Integer rows,
            @RequestParam(required = false) String space,
            @RequestParam(required = false) boolean reverse) throws NoStreamsException {
        if (TextUtils.isEmpty(streamId))
            throw new NoStreamsException();

        if (TextUtils.isEmpty(symbolId))
            return ResponseEntity.notFound().build();

        return select(new String[]{streamId}, new String[]{symbolId}, types, depth, from, to, offset, rows, space, reverse);
    }

    private SelectionOptions getSelectionOption(BaseRequest r) {
        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = r.reverse;
        options.raw = true;
        options.withSpaces(r.space);

        return options;
    }

    private SelectionOptions getSelectionOption(ExportRequest r) {
        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = r.reverse;
        options.raw = true;

        return options;
    }

    private final DataType[] ALL_TYPES = new DataType[]{
            new BooleanDataType(true),
            new CharDataType(true),
            new VarcharDataType(VarcharDataType.ENCODING_INLINE_VARSIZE, true, true),
            new VarcharDataType(VarcharDataType.ENCODING_ALPHANUMERIC + "(10)", true, true),
            BinaryDataType.getDefaultInstance(),
            new TimeOfDayDataType(true),
            new DateTimeDataType(true),

            new FloatDataType(FloatDataType.ENCODING_FIXED_FLOAT, true),
            new FloatDataType(FloatDataType.ENCODING_FIXED_DOUBLE, true),
            new FloatDataType(FloatDataType.ENCODING_SCALE_AUTO, true),
            new FloatDataType(FloatDataType.ENCODING_DECIMAL64, true),

            new IntegerDataType(IntegerDataType.ENCODING_INT8, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT16, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT32, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT48, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT64, true),

            new EnumDataType(true, new EnumClassDescriptor("ENUM", "ENUM", "")),
            new ClassDataType(true),
            new ArrayDataType(true, null),
    };

    /*
     * List all types
     * @return all types array
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/datatypes", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DataTypeDef[]> allTypes() {
        return ResponseEntity.ok().body(schemaManipulationService.allTypes());
    }

    /**
     * Create stream with provided key, schema and distribution factor.
     *
     * @param key                stream key
     * @param distributionFactor stream distribution factor
     * @param schema             stream schema
     * @return new stream schema
     * @throws WriteOperationsException if timebase is readonly
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/createStream", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SchemaDef> createStream(@RequestParam String key,
                                                  @RequestParam(required = false, defaultValue = "0") int distributionFactor,
                                                  @RequestBody SchemaDef schema) throws WriteOperationsException {
        return ResponseEntity.ok(schemaManipulationService.createStream(key, schema, distributionFactor));
    }

    /**
     * List changes between current stream schema and provided by user.
     *
     * @param streamId             stream key
     * @param schemaChangesRequest new schema and schema mapping
     * @return changes
     * @throws UnknownStreamException if stream does not exist
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/getSchemaChanges", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamMetaDataChangeDef> getSchemaChanges(@PathVariable String streamId,
                                                                    @RequestBody SchemaChangesRequest schemaChangesRequest)
            throws UnknownStreamException {
        return ResponseEntity.ok(schemaManipulationService.schemaChanges(streamId, schemaChangesRequest));
    }

    /**
     * Execute schema change.
     *
     * @param streamId            stream key
     * @param changeSchemaRequest new stream schema, schema mapping and default values
     * @return new stream schema
     * @throws UnknownStreamException       if stream does not exist
     * @throws WriteOperationsException     if timebase is readonly
     * @throws InvalidSchemaChangeException if some of default values are missing
     */
    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/changeSchema", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SchemaDef> changeSchema(@PathVariable String streamId, @RequestBody ChangeSchemaRequest changeSchemaRequest)
            throws InvalidSchemaChangeException, UnknownStreamException, WriteOperationsException {
        return ResponseEntity.ok(schemaManipulationService.changeSchema(streamId, changeSchemaRequest));
    }


    /*
     * <p>Returns data types for the specified stream</p>
     *
     * @param streamId stream key
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/schema", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SchemaDef> schema(@PathVariable String streamId,
                                            @RequestParam(required = false, defaultValue = "false") boolean tree)
            throws UnknownStreamException {
        return ResponseEntity.ok().body(schemaManipulationService.schema(streamId, tree));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/currencies", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CurrencyDef[]> currencies() {

//        LOGGER.log(LogLevel.INFO, "GET CURRENCIES() ");
//
//        DXTickStream stream = service.getCurrenciesStream();
//
//        ArrayList<CurrencyDef> currencies = new ArrayList<CurrencyDef>();
//
//        if (stream == null) {
//            Collection<CurrencyMessage> list = service.getProviderCurrencyInfo();
//            for (CurrencyMessage msg : list)
//                currencies.add(new CurrencyDef(msg.getAlphabeticCode().toString(), msg.getNumericCode()));
//        } else {
//            try (TickCursor cursor = service.getConnection().select(
//                    Long.MIN_VALUE, new SelectionOptions(),
//                    new String[]{deltix.timebase.api.messages.currency.CurrencyMessage.CLASS_NAME},
//                    stream)) {
//                while (cursor.next()) {
//                    deltix.timebase.api.messages.currency.CurrencyMessage currencyMessage =
//                            (deltix.timebase.api.messages.currency.CurrencyMessage) cursor.getMessage();
//                    currencies.add(new CurrencyDef(currencyMessage.getSign().toString(), currencyMessage.getCode()));
//                }
//            }
//        }

//        return ResponseEntity.ok(currencies.toArray(new CurrencyDef[currencies.size()]));
        return ResponseEntity.ok(new CurrencyDef[0]);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/instruments/{id}", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<InstrumentDef> instruments(@PathVariable String id, @RequestParam(required = false) String[] hiddenExchanges) {
        return ResponseEntity.ok(
            instrumentsService.getInstrument(
                id, hiddenExchanges != null ? new HashSet<>(Arrays.asList(hiddenExchanges)) : new HashSet<>()
            )
        );
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/settings", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AppSettingDef> settings(OutputStream outputStream) {

        LOGGER.log(LogLevel.INFO, "GET App Settings");

        return ResponseEntity.ok(new AppSettingDef());
    }

    /**
     * Describe query
     *
     * @param select query request
     * @return schema, that describes request
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/describe", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SchemaDef> describe(@Valid @RequestBody QueryRequest select,
                                              @RequestParam(required = false, defaultValue = "false") boolean tree) {

        if (select == null || StringUtils.isEmpty(select.query))
            return ResponseEntity.badRequest().build();

        return ResponseEntity.ok().body(schemaManipulationService.describe(select, tree));
    }

    /**
     * Compile query
     *
     * @param select query request
     * @return schema, that describes request
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/compileQuery", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CompileResult> compile(@Valid @RequestBody QueryRequest select) {

        if (select == null || StringUtils.isEmpty(select.query))
            return ResponseEntity.badRequest().build();

        DXTickDB connection = service.getConnection();

        if (connection instanceof TickDBClient) {
            ArrayList<Token> tokens = new ArrayList<Token>();
            CompileResult result;

            try {
                ((TickDBClient) connection).compileQuery(select.query, tokens);
                result = new CompileResult(tokens);
            } catch (CompilationException ex) {
                result = new CompileResult(ex.getMessage(), ex.location, tokens);
            }

            return ResponseEntity.ok().body(result);
        }

        return ResponseEntity.badRequest().build();
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/options", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamOptionsDef> streamOptions(@PathVariable String streamId) {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            return ResponseEntity.badRequest().build();

        return ResponseEntity.ok().body(optionsService.streamOptions(stream));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/options/{symbolId}", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SymbolOptions> symbolOptions(@PathVariable String streamId,
                                                          @PathVariable String symbolId) {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null || !optionsService.checkSymbol(stream, symbolId))
            return ResponseEntity.badRequest().build();

        return ResponseEntity.ok().body(optionsService.symbolOptions(stream, symbolId));
    }

//    void toSimple(DataFieldInfo[] list, List<FieldDef> fields) {
//        if (list != null) {
//            for (DataFieldInfo info : list) {
//                if (info instanceof StaticFieldInfo)
//                    fields.add(new StaticFieldDef(info.getName(), info.getTitle(), getTypeName(info.getType()), info.getType().isNullable(), ((StaticFieldInfo) info).getString()));
//                else
//                    fields.add(new FieldDef(info.getName(), info.getTitle(), getTypeName(info.getType()), info.getType().isNullable()));
//            }
//        }
//    }
//
//    void toSimple(DataField[] list, List<FieldDef> fields) {
//        if (list != null) {
//            for (DataField info : list) {
//                if (info instanceof StaticDataField)
//                    fields.add(new StaticFieldDef(info.getName(), info.getTitle(), getTypeName(info.getType()), info.getType().isNullable(), ((StaticDataField) info).getStaticValue()));
//                else
//                    fields.add(new FieldDef(info.getName(), info.getTitle(), getTypeName(info.getType()), info.getType().isNullable()));
//            }
//        }
//    }

    private static String getTypeName(DataType type) {
        if (type instanceof ClassDataType) {
            RecordClassDescriptor[] descriptors = ((ClassDataType) type).getDescriptors();
            return type.getBaseName() + "[" + Stream.of(descriptors).map(NamedDescriptor::getName).collect(Collectors.joining(",")) + "]";
        } else if (type instanceof ArrayDataType) {
            DataType dataType = ((ArrayDataType) type).getElementDataType();
            return type.getBaseName() + "[" + getTypeName(dataType) + "]";
        }

        if (type.getEncoding() != null)
            return String.format("%s (%s)", type.getBaseName(), type.getEncoding());

        return type.getBaseName();
    }

    /**
     * <p>Returns time range of the specified stream and specified symbols</p>
     *
     * @param streamId stream key
     * @param symbols  symbols list (Optional)
     * @param space    stream space(partition) name. Used when symbols list is empty.
     * @return List of rows
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/range", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<TimeRangeDef> range(@PathVariable String streamId,
                                              @RequestParam(value = "symbols", required = false) String[] symbols,
                                              @RequestParam(required = false) String space,
                                              @RequestParam(required = false) Long barSize) throws UnknownStreamException {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        IdentityKey[] ids = match(stream, symbols);
        long[] range;

        if (space != null && (symbols == null || symbols.length == 0))
            range = stream.getTimeRange(space);
        else
            range = ids != null && ids.length > 0 ? stream.getTimeRange(ids) : stream.getTimeRange();

        if (barSize != null) {
            range[1] = roundEndTime(range[1], barSize);
        }

        return ResponseEntity.ok().body(new TimeRangeDef(range));
    }

    /**
     * Return a list of instruments, for which this stream has any data.
     *
     * @param streamId stream key
     * @param filter   symbols filter
     * @param space    stream space(partition) name. if not special, all stream symbols will be returned
     * @return Instruments list. If filter is empty returns all instruments, otherwise returns all instruments,
     * if <code>streamId</code> starts with <code>filter</code>, or instruments, that start with <code>filter</code> if not.
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/symbols", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> symbols(@PathVariable String streamId,
                                     @RequestParam(required = false, defaultValue = "") String filter,
                                     @RequestParam(required = false) String space) throws UnknownStreamException {

        DXTickStream stream = service.getStream(streamId);
        if (stream == null)
            throw new UnknownStreamException(streamId);

        IdentityKey[] ids = space != null ? stream.listEntities(space) : stream.listEntities();

        Stream<CharSequence> symbols = Arrays.stream(ids).map(IdentityKey::getSymbol);

        if (filter != null && !filter.isEmpty())
            symbols = symbols.filter(s -> s.toString().toLowerCase().contains(filter.toLowerCase()));

        return new ResponseEntity<>(symbols.collect(Collectors.toList()), HttpStatus.OK);
    }

    /**
     * Return a list of available streams
     *
     * @param filter start of stream key
     * @return Streams list. If filter is not null or empty, returns only streams, for that
     * <code>key.startsWith(filter)</code> is true or stream contains symbol, for that <code>symbol.startsWith(filter)</code> is true.
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/streams", method = RequestMethod.GET)
    public ResponseEntity<StreamDef[]> streams(@RequestParam(required = false, defaultValue = "") String filter,
                                               @RequestParam(required = false) boolean spaces) {
        LOGGER.log(LogLevel.INFO, "GET streams() using filter = %s").with(filter);

        DXTickStream[] streams = service.listStreams(filter, spaces);

//        List<DXTickStream> list = Arrays.stream(streams)
//                //.filter((stream)->stream.getScope() == StreamScope.DURABLE) // Hide 'transient' streams
//                .filter((s) -> !s.getKey().contains("#")) // Hide 'system' streams
//                .collect(Collectors.toList());

        StreamDef[] result = new StreamDef[streams.length];

        for (int i = 0, listSize = streams.length; i < listSize; i++) {
            DXTickStream stream = streams[i];
            result[i] = new StreamDef(stream.getKey(), stream.getName(), stream.listEntities().length);

            ChartType[] chartTypes = TBWGUtils.chartTypes(stream);
            if (chartTypes.length > 0)
                result[i].chartType = chartTypes;
        }

        return ResponseEntity.ok().body(result);
    }

    /**
     * Returns data from specified QQL getQuery. See timebase QQL documentation for more information. For example: "SELECT * FROM level1Stream WHERE (this is not deltix.qsrv.hf.pub.BestBidOfferMessage) or (isNational=10)"
     *
     * @param select selection options
     * @return streams list
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/query", method = {RequestMethod.POST})
    public ResponseEntity<StreamingResponseBody> query(@Valid @RequestBody(required = false) QueryRequest select)
            throws InvalidQueryException, WriteOperationsException {

        if (select == null || StringUtils.isEmpty(select.query))
            throw new InvalidQueryException(select == null ? "" : select.query);

        if (service.isReadonly() && (select.query.toLowerCase().contains("drop") || select.query.toLowerCase().contains("create")))
            throw new WriteOperationsException("CREATE or DROP");

        SelectionOptions options = getSelectionOption(select);

        final long startIndex = select.offset < 0 ? 0 : select.offset;
        final long endIndex = startIndex + select.rows - 1; // inclusive
        LOGGER.log(LogLevel.INFO, "QUERY (" + select.query + ") WHERE MESSAGE_INDEX in [" + startIndex + ", " + endIndex + "]");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new MessageSource2ResponseStream(
                        service.getConnection().executeQuery(
                                select.query, options, null, null, select.getStartTime(Long.MIN_VALUE), select.getEndTime(Long.MIN_VALUE)),
                        select.getEndTime(), startIndex, endIndex, MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET));
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ')")
    @RequestMapping(value = "/query-info/functions", method = {RequestMethod.GET})
    public List<FunctionDef> queryFunctions() {
        SelectionOptions options = new SelectionOptions();
        options.raw = true;
        options.live = false;

        InstrumentMessageSource cursor = service.getConnection().executeQuery(
        "select\n" +
            "stateful.id as 'name',\n" +
            "stateful.returnType as 'returnType',\n" +
            "stateful.arguments as 'arguments',\n" +
            "stateful.initArguments as 'initArguments'\n" +
            "ARRAY JOIN  stateful_functions() as 'stateful'\n" +
            "UNION\n" +
            "select\n" +
            "stateless.id as 'name',\n" +
            "stateless.returnType as 'returnType',\n" +
            "stateless.arguments as 'arguments'\n" +
            "ARRAY JOIN  stateless_functions() as 'stateless'",
            options
        );

        RawMessageHelper rawMessageHelper = new RawMessageHelper();
        List<FunctionDef> result = new ArrayList<>();
        while (cursor.next()) {
            InstrumentMessage message = cursor.getMessage();
            if (message instanceof RawMessage) {
                RawMessage rawMessage = (RawMessage) message;
                result.add(ObjectMappingUtils.convertFunctionDef(
                    rawMessageHelper.getValues(rawMessage)
                ));
            }
        }

        return result;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ')")
    @RequestMapping(value = "/query-info/functions-short", method = {RequestMethod.GET})
    public Set<String> queryFunctionsShort() {
        SelectionOptions options = new SelectionOptions();
        options.raw = true;
        options.live = false;

        InstrumentMessageSource cursor = service.getConnection().executeQuery(
        "select stateful.id as 'name' ARRAY JOIN  stateful_functions() as 'stateful'\n" +
            "UNION \n" +
            "select stateless.id as 'name' ARRAY JOIN  stateless_functions() as 'stateless'",
            options
        );

        RawMessageHelper rawMessageHelper = new RawMessageHelper();
        Set<String> result = new LinkedHashSet<>();
        while (cursor.next()) {
            InstrumentMessage message = cursor.getMessage();
            if (message instanceof RawMessage) {
                RawMessage rawMessage = (RawMessage) message;
                Map<String, Object> values = rawMessageHelper.getValues(rawMessage);
                Object nameObj = values.get("name");
                if (nameObj instanceof String) {
                    result.add(nameObj.toString());
                }
            }
        }

        return result;
    }

    /**
     * Returns filtered messages from specified stream.
     *
     * @param streamId stream key
     * @param filter   filter request
     * @return messages, that accepted  by filters
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/{streamId}/filter", method = {RequestMethod.POST}, consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<StreamingResponseBody> filter(@PathVariable String streamId, @Valid @RequestBody FilterRequest filter)
            throws UnknownStreamException {
        DXTickStream stream = service.getStream(streamId);
        if (stream == null)
            throw new UnknownStreamException(streamId);

        SelectionOptions options = getSelectionOption(filter);

        final long startIndex = filter.offset < 0 ? 0 : filter.offset;
        final long endIndex = startIndex + filter.rows - 1; // inclusive

        long startTime = filter.getStartTime(Long.MIN_VALUE);
        long endTime = filter.getEndTime();

        final SelectBuilder selectBuilder = SelectBuilder.builder(stream);
        for (Map.Entry<String, List<RawFilter>> entry : filter.filters.entrySet()) {
            for (RawFilter rawFilter : entry.getValue()) {
                try {
                    FilterFactory.createFilter(entry.getKey(), rawFilter).appendTo(selectBuilder);
                } catch (SelectBuilder.NoSuchFieldException | SelectBuilder.WrongTypeException exc) {
                    return ResponseEntity.status(400)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(createMessage(exc.toString()));
                }
            }
        }
        String query = selectBuilder.toString();

        LOGGER.log(LogLevel.INFO, "QUERY (" + query + ") WHERE MESSAGE_INDEX in [" + startIndex + ", " + endIndex + "]");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON_UTF8)
                .body(new MessageSource2ResponseStream(service.getConnection()
                        .executeQuery(query, options, null, null, startTime), endTime, startIndex, endIndex,
                        MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET));
    }

    /**
     * Returns order book snapshot for specified stream message state.
     *
     * @param streams Specified streams to be subscribed
     * @param symbol  Specified instrument (symbol) to be subscribed.
     * @param types   Specified message types to be subscribed. If undefined, then all types will be subscribed.
     * @param from    Query start time
     * @param offset  Start row offset. (By default = 0)
     * @param reverse Result direction of messages according to timestamp
     * @return Order book snapshot.
     */
    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ')")
    @RequestMapping(value = "/order-book", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_JSON_VALUE)
    public L2PackageDto orderBook(
        @RequestParam String[] streams,
        @RequestParam String symbol,
        @RequestParam(required = false) String[] types,
        @RequestParam(required = false) String[] symbols,
        @RequestParam(required = false) Instant from,
        @RequestParam(required = false) Long offset,
        @RequestParam(required = false) String space,
        @RequestParam(required = false) boolean reverse) throws NoStreamsException
    {
        OrderBookSnapshotRequest request = new OrderBookSnapshotRequest();
        request.setStreams(streams);
        request.setSymbol(symbol);
        request.setTypes(types);
        request.setSymbols(symbols);
        request.setFrom(from != null ? from.toEpochMilli() : (reverse ? Long.MAX_VALUE : Long.MIN_VALUE));
        request.setOffset(offset != null ? offset : 0);
        request.setReverse(reverse);
        request.setSpace(space);

        return orderBookDebugger.snapshot(request);
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ')")
    @RequestMapping(value = "/order-book", method = {RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public L2PackageDto orderBook(@Valid @RequestBody OrderBookRequest request) throws NoStreamsException
    {
        OrderBookSnapshotRequest snapshotRequest = new OrderBookSnapshotRequest();
        snapshotRequest.setStreams(request.streams);
        snapshotRequest.setSymbol(request.symbol);
        snapshotRequest.setTypes(request.types);
        snapshotRequest.setSymbols(request.symbols);
        snapshotRequest.setFrom(request.from != null ? request.from.toEpochMilli() : (request.reverse ? Long.MAX_VALUE : Long.MIN_VALUE));
        snapshotRequest.setOffset(request.offset);
        snapshotRequest.setReverse(request.reverse);
        snapshotRequest.setSpace(request.space);

        return orderBookDebugger.snapshot(snapshotRequest);
    }

    @ExceptionHandler({OutOfMemoryError.class})
    public ResponseEntity<?> handleOOMException() {
        return ResponseEntity.badRequest().body("Request is too large, try using paging");
    }

    private static class ErrorWriter implements StreamingResponseBody, LoadingErrorListener {

        private final JsonStringEncoder encoder = new JsonStringEncoder();

        boolean empty = true;

        private final StringBuilder sb = new StringBuilder();

        @Override
        public void writeTo(OutputStream outputStream) throws IOException {
            try (OutputStreamWriter writer = new OutputStreamWriter(outputStream)) {
                writer.append('[');
                writer.append(sb.toString());
                writer.append(']');
            }
        }

        @Override
        public void onError(LoadingError e) {
            writeError(e);
        }

        public void writeError(LoadingError e) {
            if (!empty)
                sb.append(',');
            else
                empty = false;

            sb.append('{').append("\"description\":\"");
            String message = e.getMessage();
            if (message != null)
                encoder.quoteAsString(message, sb);
            sb.append("\",").append("\"error\":");
            appendError(sb, e);
            sb.append('}');
        }

        private void appendError(StringBuilder sb, Throwable ex) {
            Throwable x = ex.getCause() != null ? ex.getCause() : ex;
            StackTraceElement[] trace = x.getStackTrace();

            sb.append("\"");
            sb.append(x.getClass().getName()).append(":");
            sb.append(encoder.quoteAsString(x.getMessage()));

            if (trace != null && trace.length > 2)
                sb.append(" \n").append(trace[0]).append("\n").append(trace[1]).append("\n").append(trace[2]);

            sb.append("\"");
        }
    }

    private static ShortMessage createMessage(String message) {
        return new ShortMessage(message);
    }

    private static class ShortMessage implements StreamingResponseBody {

        private final String message;

        public ShortMessage(String message) {
            this.message = message;
        }

        @Override
        public void writeTo(OutputStream outputStream) throws IOException {
            try (PrintWriter writer = new PrintWriter(outputStream)) {
                writer.print(message);
            }
        }
    }

}
