package com.epam.deltix.tbwg.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;
import com.epam.deltix.tbwg.services.timebase.base.SelectService;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.tbwg.model.input.SelectRequest;
import com.epam.deltix.tbwg.services.timebase.exc.NoStreamsException;
import com.epam.deltix.tbwg.utils.MessageSource2ResponseStream;
import com.epam.deltix.util.time.GMT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

import static com.epam.deltix.tbwg.utils.TBWGUtils.*;

@Component
public class SelectServiceImpl implements SelectService {

    private static final Log LOG = LogFactory.getLog(SelectServiceImpl.class);

    private final TimebaseServiceImpl timebase;

    @Autowired
    public SelectServiceImpl(TimebaseServiceImpl timebase) {
        this.timebase = timebase;
    }

    @Override
    public MessageSource2ResponseStream select(long startTime, long endTime, long offset, int rows, boolean reverse,
                                               String[] types, String[] symbols, String[] keys, String space, int maxRecords)
            throws NoStreamsException {

        List<DXTickStream> streams = getStreams(keys);
        HashSet<IdentityKey> instruments = getInstruments(streams, symbols);
        SelectionOptions options = getSelectionOptions(reverse);
        final long startIndex = offset < 0 ? 0 : offset;
        final long endIndex = startIndex + rows - 1; // inclusive
        //DXTickStream[] tickStreams = streams.toArray(new DXTickStream[streams.size()]);

        TickCursor source;

        if (streams.size() == 1 && space != null) {
            options.space = space;
            source = streams.get(0).select(startTime, options, types, toArray(instruments));
        } else {
            source = timebase.getConnection().select(startTime, options, types, toArray(instruments),
                    streams.toArray(new DXTickStream[streams.size()]));
        }

        LOG.info().append("SELECT * FROM [")
                .append(streams.stream().map(DXTickStream::getKey).collect(Collectors.joining(",")))
                .append("] WHERE MESSAGE_INDEX IN [").append(startIndex).append(", ").append(endIndex).append("] ")
                .append(space != null ? "AND SPACE = [" + space + "] " : "")
                .append("AND TYPES = [").append(Arrays.toString(types))
                .append("] AND ENTITIES = [").append(Arrays.toString(toArray(instruments))).append("] ")
                .append("AND timestamp [").append(GMT.formatDateTimeMillis(startTime)).append(":")
                .append(GMT.formatDateTimeMillis(endTime)).append("]")
                .commit();
        return new MessageSource2ResponseStream(source, endTime, startIndex, endIndex, maxRecords);
    }

    @Override
    public MessageSource2ResponseStream select(SelectRequest selectRequest, int maxRecords) throws NoStreamsException {
        List<DXTickStream> streams = getStreams(selectRequest.streams);
        long startTime = selectRequest.getStartTime(TimebaseServiceImpl.getEndTime(streams));
        return select(startTime, selectRequest.getEndTime(), selectRequest.offset, selectRequest.rows, selectRequest.reverse,
                selectRequest.types, selectRequest.symbols, selectRequest.streams, selectRequest.space, maxRecords);
    }

    private List<DXTickStream> getStreams(String ... streamKeys) throws NoStreamsException {
        if (streamKeys == null || streamKeys.length == 0) {
            throw new NoStreamsException();
        }
        List<DXTickStream> streams = new ArrayList<>(streamKeys.length);
        for (String key : streamKeys) {
            DXTickStream stream = timebase.getStream(key);
            if (stream != null)
                streams.add(stream);
        }
        if (streams.isEmpty()) {
            throw new NoStreamsException(streamKeys);
        }
        return streams;
    }

    private HashSet<IdentityKey> getInstruments(List<DXTickStream> streams, String ... symbols) {
        final HashSet<IdentityKey> instruments;
        if (symbols != null) {
            instruments = new HashSet<>();
            for (DXTickStream stream : streams)
                Collections.addAll(instruments, match(stream, symbols));
        } else {
            instruments = null;
        }
        return instruments;
    }

    private static SelectionOptions getSelectionOptions(boolean reverse) {
        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = reverse;
        options.raw = true;
        return options;
    }
}
