package com.epam.deltix.tbwg.controllers;

import com.epam.deltix.tbwg.model.*;
import com.epam.deltix.tbwg.model.input.*;
import com.epam.deltix.tbwg.model.schema.*;
import com.epam.deltix.tbwg.services.timebase.exc.*;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentKey;
import com.epam.deltix.util.collections.CharSequenceSet;
import com.fasterxml.jackson.core.io.JsonStringEncoder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.gflog.api.LogLevel;
import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.stream.MessageWriter2;
import com.epam.deltix.qsrv.hf.tickdb.client.Version;
import com.epam.deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import com.epam.deltix.qsrv.hf.tickdb.lang.pub.Token;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.TickDBShell;
import com.epam.deltix.qsrv.util.json.JSONRawMessageParser;
import com.epam.deltix.tbwg.Application;

import com.epam.deltix.tbwg.model.filter.FilterFactory;
import com.epam.deltix.tbwg.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.services.timebase.TimebaseServiceImpl;
import com.epam.deltix.tbwg.services.timebase.base.SchemaManipulationService;
import com.epam.deltix.tbwg.services.timebase.base.SelectService;
import com.epam.deltix.tbwg.utils.CsvLineWriter;
import com.epam.deltix.tbwg.utils.MessageSource2ResponseStream;
import com.epam.deltix.tbwg.utils.qql.SelectBuilder;
import com.epam.deltix.util.io.CSVWriter;
import com.epam.deltix.util.io.GUID;
import com.epam.deltix.util.lang.StringUtils;
import com.epam.deltix.util.parsers.CompilationException;
import com.epam.deltix.util.text.SimpleStringCodec;
import com.epam.deltix.util.time.GMT;
import com.epam.deltix.util.time.Interval;
import com.epam.deltix.util.time.Periodicity;
import com.epam.deltix.computations.utils.ObjectToObjectHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static com.epam.deltix.tbwg.utils.TBWGUtils.*;

/**
 * Default controller for REST API
 */
@RestController
@RequestMapping("/api/v0")
@CrossOrigin
public class TimebaseController {

    static final int MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET;
    static final int MAX_EXPORT_PROCESSES;

    static {
        int maxNumberOfRecords;
        int maxExportProcs;
        try {
            maxNumberOfRecords = Integer.parseInt(System.getProperty("com.epam.deltix.tbwg.services.maxRecordSetSize", "10000"));
            maxExportProcs = Integer.parseInt(System.getProperty("com.epam.deltix.tbwg.maxExportProcs", "5"));
        } catch (NumberFormatException ex) {
            maxNumberOfRecords = 10000;
            maxExportProcs = 5;
        }
        MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET = maxNumberOfRecords;
        MAX_EXPORT_PROCESSES = maxExportProcs;
    }

    final String[] EMPTY_LIST = new String[0];

    private static final Log LOGGER = LogFactory.getLog(TimebaseController.class);

    private final AtomicLong exportProcesses = new AtomicLong();
    private final ObjectToObjectHashMap<String, StreamingResponseBody> downloads = new ObjectToObjectHashMap<>();

    private final TimebaseServiceImpl service;
    private final SchemaManipulationService schemaManipulationService;
    private final SelectService selectService;

    @Autowired
    public TimebaseController(TimebaseServiceImpl service, SchemaManipulationService schemaManipulationService,
                              SelectService selectService) {
        this.service = service;
        this.schemaManipulationService = schemaManipulationService;
        this.selectService = selectService;
    }

    @RequestMapping(value = {"/v", "/"}, method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public VersionDef version() {
        return new VersionDef("Timebase Web Gateway", Application.VERSION, System.currentTimeMillis(),
                new VersionDef.TimeBase(Version.getVersion(), service.getServerVersion()), true);
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
        if (StringUtils.isEmpty(streamId))
            throw new NoStreamsException();

        return select(new String[]{streamId}, symbols, types, depth, from, to, offset, rows, space, reverse);
    }

    // download operation is permitted for any user
//    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @RequestMapping(value = "/download", method = {RequestMethod.GET}, produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> download(@RequestParam(required = true) String id) {
        StreamingResponseBody body;

        synchronized (downloads) {
            body = downloads.remove(id, null);
        }

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

        HashSet<String> instruments = null;

        if (select.symbols != null) {
            instruments = new HashSet<>();

            //for (DXTickStream stream : streams)
            Collections.addAll(instruments, select.symbols);
        }

        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = select.reverse;
        options.raw = true;

        final long startIndex = select.offset < 0 ? 0 : select.offset;
        final long endIndex = select.rows < 0 ? -1 : startIndex + select.rows - 1; // inclusive

        DXTickStream[] tickStreams = streams.toArray(new DXTickStream[streams.size()]);

        long startTime = select.getStartTime(TimebaseServiceImpl.getEndTime(tickStreams));

        String[] ids = collect(instruments);

        Interval periodicity = streams.size() == 1 ? streams.get(0).getPeriodicity().getInterval() : null;

        RecordClassDescriptor[] descriptors = TickDBShell.collectTypes(streams.toArray(new TickStream[streams.size()]));

        LOGGER.log(LogLevel.INFO, "EXPORT * FROM " + Arrays.toString(select.streams) + " WHERE MESSAGE_INDEX IN [" + startIndex + ", " + endIndex + "] " +
                "AND TYPES = [" + Arrays.toString(select.getTypes()) + "] AND ENTITIES = [" + Arrays.toString(ids) + "] " +
                "AND timestamp [" + GMT.formatDateTimeMillis(startTime) + ":" + GMT.formatDateTimeMillis(select.getEndTime()) + "]");

        StreamingResponseBody body = getExportResponse(
                new ExportSourceFactory(startTime, options, tickStreams, select.getTypes(), ids),
                select, startTime, select.getEndTime(), startIndex, endIndex, periodicity,
                descriptors
        );
        String id = new GUID().toString();

        synchronized (downloads) {
            downloads.put(id, body);
        }

        return ResponseEntity.ok(new DownloadId(id));
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

        SelectionOptions options = getSelectionOption(select);

        final long startIndex = select.offset < 0 ? 0 : select.offset;
        final long endIndex = select.rows < 0 ? -1 : startIndex + select.rows - 1; // inclusive

        long startTime = select.getStartTime(TimebaseServiceImpl.getEndTime(stream));

        Interval periodicity = stream.getPeriodicity().getInterval();

        StreamingResponseBody body = getExportResponse(
                new ExportSourceFactory(startTime, options, new DXTickStream[]{stream}, select.getTypes(), select.symbols),
                select, startTime, select.getEndTime(), startIndex, endIndex, periodicity,
                stream.getTypes()
        );
        String id = new GUID().toString();

        synchronized (downloads) {
            downloads.put(id, body);
        }

        return ResponseEntity.ok(new DownloadId(id));
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
        if (StringUtils.isEmpty(streamId))
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

        if (StringUtils.isEmpty(streamId))
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

    private FileResponseBody getExportResponse(
            ExportSourceFactory exportSourceFactory,
            ExportRequest request,
            long startTime, long endTime,
            long startIndex, long endIndex,
            Interval periodicity,
            RecordClassDescriptor[] rcds) {
        if (exportProcesses.incrementAndGet() >= MAX_EXPORT_PROCESSES) {
            LOGGER.error().append("Number of export requests over the limit ").append(MAX_EXPORT_PROCESSES).append(".")
                    .append(exportProcesses.get()).append(" EXPORT processes are currently running.")
                    .commit();
            return null;
        }

        String file = request.getFileName("download");

        return request.format == ExportFormat.QSMSG ?
                new MessageSource2QMSGFile(
                        file, exportSourceFactory, request, startTime, endTime, startIndex, endIndex, periodicity, rcds
                ) :
                new CSVExporter(file, exportSourceFactory, request, startTime, endTime, startIndex, endIndex, rcds);
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

        return ResponseEntity.badRequest().build();
        //TODO: VERSION5.5
        //stream.renameSpace(newName, space);
        //return ResponseEntity.ok().build();
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

        //TODO: VERSION5.5
//        stream.deleteSpaces(space);
//        return ResponseEntity.ok().build();
        return ResponseEntity.badRequest().build();
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
    public ResponseEntity<StreamingResponseBody> write(@PathVariable String streamId, @RequestBody String messages) throws UnknownStreamException {

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
        try (TickLoader loader = stream.createLoader(new LoadingOptions(true))) {

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

        long startTime = select.getStartTime(TimebaseServiceImpl.getEndTime(stream));

        LOGGER.log(LogLevel.INFO, "SELECT * FROM " + streamId + " WHERE MESSAGE_INDEX IN [" + startIndex + ", " + endIndex + "] " +
                "AND TYPES = [" + Arrays.toString(select.types) + "] AND ENTITIES = [" + Arrays.toString(ids) + "] " +
                (options.space != null ? "AND SPACE = [" + options.space + "]" : "") +
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
        if (StringUtils.isEmpty(streamId))
            throw new NoStreamsException();

        if (StringUtils.isEmpty(symbolId))
            return ResponseEntity.notFound().build();

        return select(new String[]{streamId}, new String[]{symbolId}, types, depth, from, to, offset, rows, space, reverse);
    }

    private SelectionOptions getSelectionOption(BaseRequest r) {
        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = r.reverse;
        options.raw = true;
        options.space = r.space;

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

        LOGGER.log(LogLevel.INFO, "GET CURRENCIES() ");
        return ResponseEntity.ok(new CurrencyDef[0]);
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
    public ResponseEntity<SchemaDef> describe(@Valid @RequestBody QueryRequest select) {

        if (select == null || StringUtils.isEmpty(select.query))
            return ResponseEntity.badRequest().build();

        return ResponseEntity.ok().body(schemaManipulationService.describe(select));
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
    public ResponseEntity<OptionsDef> options(@PathVariable String streamId) {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            return ResponseEntity.badRequest().build();

        StreamOptions options = stream.getStreamOptions();

        OptionsDef def = new OptionsDef();
        def.name = options.name;
        def.key = stream.getKey();
        def.description = options.description;
        def.highAvailability = options.highAvailability;
        def.distributionFactor = options.distributionFactor;
        def.owner = options.owner;

        Periodicity p = options.periodicity;
        if (p != null)
            def.periodicity = new PeriodicityDef(p.getInterval() != null ? p.getInterval().toHumanString() : null, p.getType());

        def.scope = options.scope;
        def.bufferOptions = options.bufferOptions;

        long[] range = stream.getTimeRange();
        def.range = new TimeRangeDef(range);

        return ResponseEntity.ok().body(def);
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
                                              @RequestParam(required = false) String space) throws UnknownStreamException {
        DXTickStream stream = service.getStream(streamId);

        if (stream == null)
            throw new UnknownStreamException(streamId);

        IdentityKey[] ids = match(stream, symbols);
        long[] range;

        if (space != null && (symbols == null || symbols.length == 0))
            range = stream.getTimeRange(space);
        else
            range = ids != null && ids.length > 0 ? stream.getTimeRange(ids) : stream.getTimeRange();

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
                                //select.query, options, null, null, select.getStartTime(Long.MIN_VALUE), select.getEndTime(Long.MIN_VALUE)),
                                select.query, options, null, null, select.getStartTime(Long.MIN_VALUE)),
                        select.getEndTime(), startIndex, endIndex, MAX_NUMBER_OF_RECORDS_PER_REST_RESULTSET));
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

    // todo: move the bunch of subclasses into separate package
    interface FileResponseBody extends StreamingResponseBody {
        String getFileName();
    }

    private class ExportSourceFactory {
        private final long startTime;
        private final SelectionOptions options;
        private final TickStream[] streams;
        private final String[] types;
        private final String[] ids;

        public ExportSourceFactory(long startTime, SelectionOptions options, TickStream[] streams, String[] types, String[] ids) {
            this.startTime = startTime;
            this.options = options;
            this.streams = streams;
            this.types = types;
            this.ids = ids;
        }

        private InstrumentMessageSource newMessageSource() {
            return service.getConnection().select(
                    startTime,
                    options,
                    types,
                    ids,
                    streams);
        }
    }

    interface ExportByKeys<T> {
        void accept(List<T> keys) throws IOException;
    }

    private abstract class StreamExporter implements FileResponseBody {
        protected final ExportSourceFactory sourceFactory;
        protected final ExportRequest request;
        protected final long fromTimestamp;
        protected final long toTimestamp;
        protected final long startIndex; // inclusive
        protected final long endIndex; // inclusive
        protected final TickStream[] streams;
        protected final RecordClassDescriptor[] descriptors;
        protected final String fileName;

        StreamExporter(String fileName, ExportSourceFactory sourceFactory, ExportRequest request,
                       long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                       RecordClassDescriptor[] descriptors) {
            this.fileName = fileName;
            this.sourceFactory = sourceFactory;
            this.request = request;
            this.fromTimestamp = fromTimestamp;
            this.toTimestamp = toTimestamp;
            this.startIndex = startIndex;
            this.endIndex = endIndex;
            this.streams = sourceFactory.streams;
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
                for (IdentityKey identity : identities)
                    set.addCharSequence(identity.getSymbol());
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

    private class CSVExporter extends StreamExporter {
        CSVExporter(String fileName, ExportSourceFactory sourceFactory,
                    ExportRequest request, long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                    RecordClassDescriptor[] descriptors) {
            super(fileName, sourceFactory, request, fromTimestamp, toTimestamp, startIndex, endIndex, descriptors);
        }

        @Override
        public void writeTo(@NotNull OutputStream outputStream) throws IOException {
            try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);
                 CSVWriter writer = createCsvWriter(zipOutputStream);)
            {
                writer.setCloseDelegate(false);
                CsvLineWriter lineWriter = new CsvLineWriter(writer, request, descriptors);

                if (request.mode == ExportMode.FILE_PER_SPACE) {
                    exportByKey(this::getSpaces, (spaces) -> exportSpaces(zipOutputStream, lineWriter, spaces));
                } else if (request.mode == ExportMode.FILE_PER_SYMBOL) {
                    exportByKey(this::getSymbols, (symbols) -> exportSymbols(zipOutputStream, lineWriter, symbols));
                } else {
                    // single file
                    zipOutputStream.putNextEntry(new ZipEntry(fileName.replace(".zip", ".csv")));
                    try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                        writeFile(source, lineWriter);
                    }
                }
            } finally {
                exportProcesses.decrementAndGet();
            }
        }

        private CSVWriter createCsvWriter(ZipOutputStream os) throws UnsupportedEncodingException {
            if (request.valueSeparator == null) {
                return new CSVWriter(os);
            } else {
                return new CSVWriter(
                    os,
                    "\\t".equals(request.valueSeparator) ? '\t' : request.valueSeparator.charAt(0),
                    "UTF8"
                );
            }
        }

        private void exportSpaces(ZipOutputStream zipOutputStream, CsvLineWriter lineWriter, List<String> spaces) throws IOException {
            for (String space : spaces) {
                sourceFactory.options.space = space;
                try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                    zipOutputStream.putNextEntry(new ZipEntry(encodeName(space) + ".csv"));
                    writeFile(source, lineWriter);
                } finally {
                    lineWriter.flush();
                    zipOutputStream.closeEntry();
                }
            }
        }

        private void exportSymbols(ZipOutputStream zipOutputStream, CsvLineWriter lineWriter, List<String> symbols) throws IOException {
            try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                for (String symbol : symbols) {
                    try {
                        zipOutputStream.putNextEntry(new ZipEntry(encodeName(symbol) + ".csv"));
                        source.clearAllSymbols();
                        source.addSymbol(symbol);
                        source.reset(fromTimestamp);
                        writeFile(source, lineWriter);
                    } finally {
                        lineWriter.flush();
                        zipOutputStream.closeEntry();
                    }
                }
            }
        }

        private void writeFile(InstrumentMessageSource source, CsvLineWriter lineWriter) throws IOException {
            lineWriter.writeHeader();
            int messageIndex = 0;// inclusive
            while (source.next() && (endIndex < 0 || messageIndex <= endIndex)) {
                if (messageIndex >= startIndex) {
                    RawMessage raw = (RawMessage) source.getMessage();
                    if (raw.getTimeStampMs() > toTimestamp)
                        break;

                    lineWriter.writeLine(raw);
                }
                messageIndex++;
            }
        }

    }

    private class MessageSource2QMSGFile extends StreamExporter {

        private final Interval periodicity;

        @SuppressWarnings({"unchecked", "unused"})
        MessageSource2QMSGFile(ExportSourceFactory sourceFactory, ExportRequest request) {
            super(null, sourceFactory, request,
                Long.MIN_VALUE, Long.MAX_VALUE, 0, Integer.MAX_VALUE, null
            );
            this.periodicity = null;
        }

        MessageSource2QMSGFile(String file, ExportSourceFactory sourceFactory, ExportRequest request,
                               long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                               Interval periodicity, RecordClassDescriptor... descriptors)
        {
            super(file, sourceFactory, request, fromTimestamp, toTimestamp, startIndex, endIndex, descriptors);
            this.periodicity = periodicity;
        }

        @Override
        public void writeTo(@NotNull OutputStream outputStream) throws IOException {
            try {
                if (request.mode == ExportMode.FILE_PER_SPACE) {
                    exportFilePerSpace(outputStream);
                } else if (request.mode == ExportMode.FILE_PER_SYMBOL) {
                    exportFilePerSymbol(outputStream);
                } else {
                    exportSingleFile(outputStream);
                }
            } finally {
                exportProcesses.decrementAndGet();
            }
        }

        private void exportSingleFile(OutputStream outputStream) throws IOException {
            try (InstrumentMessageSource source = sourceFactory.newMessageSource();
                 MessageWriter2 messageWriter = create(outputStream, periodicity, descriptors))
            {
                exportFile(messageWriter, source);
            } catch (ClassNotFoundException e) {
                LOGGER.error().append("Unexpected ").append(e).commit();
            }
        }

        private void exportFilePerSpace(OutputStream outputStream) throws IOException {
            try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream)) {
                exportByKey(this::getSpaces, (spaces) -> exportSpaces(zipOutputStream, spaces));
            }
        }

    private void exportSpaces(ZipOutputStream zipOutputStream, List<String> spaces) throws IOException {
            try {
                for (String space : spaces) {
                    zipOutputStream.putNextEntry(new ZipEntry(encodeName(space) + ".qsmgs.gz"));
                    GZIPOutputStream gzos = new GZIPOutputStream(zipOutputStream, 1 << 16 / 2);
                    MessageWriter2 messageWriter = new MessageWriter2(gzos, periodicity, null, descriptors);

                    sourceFactory.options.space = space;
                    try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                        exportFile(messageWriter, source);
                    } finally {
                        // do not close message writer, close archive entry instead
                        messageWriter.flush();
                        gzos.finish();
                        zipOutputStream.closeEntry();
                    }
                }
            } catch (ClassNotFoundException e) {
                LOGGER.error().append("Unexpected ").append(e).commit();
            }
        }

        private void exportFilePerSymbol(OutputStream outputStream) throws IOException {
            try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);
                 InstrumentMessageSource source = sourceFactory.newMessageSource())
            {
                exportByKey(this::getSymbols, (symbols) -> exportSymbols(zipOutputStream, source, symbols));
            }
        }

        private void exportSymbols(ZipOutputStream zipOutputStream, InstrumentMessageSource source, List<String> symbols) throws IOException {
            try {
                for (String symbol : symbols) {
                    zipOutputStream.putNextEntry(new ZipEntry(encodeName(symbol) + ".qsmgs.gz"));
                    GZIPOutputStream gzos = new GZIPOutputStream(zipOutputStream, 1 << 16 / 2);
                    MessageWriter2 messageWriter = new MessageWriter2(gzos, periodicity, null, descriptors);
                    try {
                        source.clearAllSymbols();
                        source.addSymbol(symbol);
                        source.reset(fromTimestamp);
                        exportFile(messageWriter, source);
                    } finally {
                        // do not close message writer, close archive entry instead
                        messageWriter.flush();
                        gzos.finish();
                        zipOutputStream.closeEntry();
                    }
                }
            } catch (ClassNotFoundException e) {
                LOGGER.error().append("Unexpected ").append(e).commit();
            }
        }

        private void exportFile(MessageWriter2 messageWriter, InstrumentMessageSource source) {
            int messageIndex = 0;// inclusive
            while (source.next() && (endIndex < 0 || messageIndex <= endIndex)) {
                if (messageIndex >= startIndex) {
                    RawMessage raw = (RawMessage) source.getMessage();
                    if (raw.getTimeStampMs() > toTimestamp)
                        break;
                    messageWriter.send(raw);
                }
                messageIndex++;
            }
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
