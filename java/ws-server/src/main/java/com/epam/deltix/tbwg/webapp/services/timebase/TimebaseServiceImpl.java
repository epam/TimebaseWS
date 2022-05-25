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
package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.data.stream.DXChannel;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.spi.conn.DisconnectEventListener;
import com.epam.deltix.qsrv.hf.spi.conn.Disconnectable;
import com.epam.deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.tbwg.webapp.settings.TimebaseSettings;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.lang.StringUtils;
import com.epam.deltix.util.lang.Util;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.Base64Utils;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.epam.deltix.tbwg.webapp.utils.TimeBaseUtils.introspectClasses;

/**
 * TimebaseService Provider
 */
@Profile("default")
@Service
public class TimebaseServiceImpl implements TimebaseService {
    private static final Log LOGGER = LogFactory.getLog(TimebaseServiceImpl.class);

    static {
        System.setProperty("deltix.securitymaster.InstrumentMetadataProviderFactory", "deltix.securitymaster.InMemoryCachingMetadataProviderFactory");
    }

    private DXTickDB db = null;
    private String dbUrl = null;
    private String serverVersion = null;

    private final TimebaseSettings timebaseSettings;
    private final SystemMessagesService systemMessagesService;

    @Autowired
    public TimebaseServiceImpl(TimebaseSettings timebaseSettings, SystemMessagesService systemMessagesService) {
        this.timebaseSettings = timebaseSettings;
        this.systemMessagesService = systemMessagesService;
    }

    //public final InstrumentMetadataProvider provider = InstrumentMetadataFactory.createProvider();

    public String getServerVersion() {
        if (serverVersion == null) {
            try {
                getConnection();
            } catch (Exception ignored) {
            }
        }
        return serverVersion;
    }

    public boolean      isConnected() {
        try {
            return ((TickDBClient)getConnection()).isConnected();
        } catch (Exception ex) {
            return false;
        }

    }

    @Override
    public String getId() {
        return db.getId();
    }

    private static class EventListener implements DisconnectEventListener {
        DXTickDB db;

        public EventListener(DXTickDB db) {
            this.db = db;
        }

        @Override
        public void onDisconnected() {
            if (db instanceof Disconnectable)
                ((Disconnectable)db).removeDisconnectEventListener(this);
            Util.close(db);
            LOGGER.info("Disconnected event received");
        }

        @Override
        public void onReconnected() {
            LOGGER.info("Reconnected event received");
        }
    }

    public static class StreamsFilter {

        private String include;
        private String exclude;

        private Pattern iPattern;
        private Pattern ePattern;

        public String   getInclude() {
            return include;
        }

        public void     setInclude(String include) {
            this.include = include;
            if (include != null && include.length() > 0)
                this.iPattern = Pattern.compile(include);
        }

        public String   getExclude() {
            return exclude;
        }

        public void     setExclude(String exclude) {
            this.exclude = exclude;
            if (exclude != null && exclude.length() > 0)
                this.ePattern = Pattern.compile(exclude);
        }

        public boolean  isMatched(String name) {
            boolean matches = true;

            if (iPattern != null)
                matches = iPattern.matcher(name).find();

            if (ePattern != null)
                matches &= !ePattern.matcher(name).find();

            return matches;
        }
    }

    public synchronized DXTickDB getOrCreate(String url, String userName, String password) {
        if (!Objects.equals(url, dbUrl) || db == null || isNotConnected(db)) {
            Util.close(db);
            dbUrl = url;
            String decoded = !StringUtils.isEmpty(password) ? new String(Base64Utils.decodeFromString(password)) : null;
            db = !StringUtils.isEmpty(userName) ? TickDBFactory.createFromUrl(url, userName, decoded) : TickDBFactory.createFromUrl(url);

            TickDBFactory.setApplicationName(db, "TB Web Gateway");
            LOGGER.info("Opening connection to TimeBase on %s.").with(url);
            db.open(timebaseSettings.isReadonly());

            if (db instanceof TickDBClient) {
                serverVersion = ((TickDBClient) db).getServerVersion();
            }
            if (db instanceof Disconnectable) {
                ((Disconnectable) db).addDisconnectEventListener(new EventListener(db));
                LOGGER.info("Subscribe to disconnect event");
            }

            if (db instanceof DBStateNotifier) {
                ((DBStateNotifier) db).addStateListener(systemMessagesService.getStateListener());
            } else {
                LOGGER.error().append("Cannot add ")
                        .append(DBStateListener.class.getSimpleName())
                        .commit();
            }
        }
        return db;
    }

    private boolean isNotConnected(DXTickDB db) {
        return !((Disconnectable) db).isConnected();
    }

    @PostConstruct
    public void logStart() {
        LOGGER.info().append("Started TimeBase service.").commit();
    }

    @PreDestroy
    public synchronized void dispose() {
        LOGGER.info("Closing TickDBClient connection to %s.")
                .with(dbUrl);
        Util.close(db);
    }

    public boolean          isReadonly() {
        return timebaseSettings.isReadonly();
    }

    public long getFlushPeriodMs() {
        return timebaseSettings.getFlushPeriodMs();
    }

    public DXTickDB         getConnection() {
        return getOrCreate(timebaseSettings.getUrl(), timebaseSettings.getUser(), timebaseSettings.getPassword());
    }

    public DXChannel[]      listChannels() {
        DXChannel[] streams = getConnection().listChannels();

        return Arrays.stream(streams).filter(x -> !x.getKey().contains("#")).toArray(DXChannel[]::new);
    }

    public DXTickStream     getStream(String key) {
        DXTickStream stream = getConnection().getStream(key);
        if (stream != null && timebaseSettings.isMatched(key))
            return stream;

        return null;
    }

    public DXTickStream getOrCreateStream(String key, Class<?>... classes) {
        return getOrCreateStream(key, StreamScope.DURABLE, classes);
    }

    public DXTickStream getOrCreateStream(String key, StreamScope scope, Class<?>... classes) {
        DXTickStream stream = db.getStream(key);
        if (stream == null) {
            LOGGER.info().append("Stream ").append(key).append(" not found.").commit();
            LOGGER.info("Creating new stream.");
            StreamOptions options = new StreamOptions(scope, key, "", 1);
            options.setPolymorphic(introspectClasses(classes));
            stream = db.createStream(key, options);
            LOGGER.info().append("Stream ").append(key).append(" created.").commit();
        } else {
            LOGGER.info("Found stream: " + key);
        }
        return stream;
    }


    public DXTickStream getStreamChecked(String key) throws UnknownStreamException {
        DXTickStream stream = getStream(key);
        if (stream == null)
            throw new UnknownStreamException(key);
        return stream;
    }

    public DXTickStream[]   listStreams() {
        Stream<DXTickStream> list = Arrays.stream(getConnection().listStreams());

        if (timebaseSettings.getStreams() != null)
            list = list.filter(x -> timebaseSettings.isMatched(x.getKey()));

        return list.toArray(DXTickStream[]::new);
    }

    public DXTickStream[]   listStreams(String filter, boolean searchSpaces) {
        Stream<DXTickStream> list = Arrays.stream(getConnection().listStreams())
                .filter(stream -> timebaseSettings.isMatched(stream.getKey()));

        if (filter != null && !filter.isEmpty())
            list = list.filter(x -> isMatched(x, filter.toLowerCase(), searchSpaces));

        return list.toArray(DXTickStream[]::new);
    }

    private boolean isMatched(DXTickStream x, String filter, boolean searchSpaces) {
        boolean matched = x.getKey().toLowerCase().contains(filter) ||
                (x.getName() != null && x.getName().toLowerCase().contains(filter)) ||
                Arrays.stream(x.listEntities()).anyMatch(entity -> entity.getSymbol().toString().toLowerCase().contains(filter));

        if (!matched && searchSpaces) {
            String[] spaces = x.listSpaces();
            matched = spaces != null && Arrays.stream(spaces).anyMatch(z -> z.toLowerCase().contains(filter));
        }

        return matched;
    }

    public List<String> listStreamKeys() {
        List<String> result = new ObjectArrayList<>();
        for (DXTickStream stream : listStreams()) {
            result.add(stream.getKey());
        }
        return result;
    }

    public DXTickStream     getCurrenciesStream() {
        return timebaseSettings.getCurrencies() != null ? getStream(timebaseSettings.getCurrencies()) : null;
    }

//    @Override
//    public Collection<CurrencyMessage> getProviderCurrencyInfo() {
//        return provider.getCurrencyInfo();
//    }

    public ObjectToObjectHashMap<RecordClassDescriptor, List<DataField>> numericFields(DXTickStream stream) {
        ObjectToObjectHashMap<RecordClassDescriptor, List<DataField>> numericFields = new ObjectToObjectHashMap<>();
        for (ClassDescriptor classDescriptor : stream.getAllDescriptors()) {
            if (classDescriptor instanceof RecordClassDescriptor) {
                RecordClassDescriptor rcd = (RecordClassDescriptor) classDescriptor;
                ObjectArrayList<DataField> dataFields = new ObjectArrayList<>();
                numericFields.put(rcd, dataFields);
                for (DataField dataField : rcd.getFields()) {
                    if (dataField instanceof NonStaticDataField) {
                        if (isNumericField(dataField)) {
                            dataFields.add(dataField);
                        }
                    }
                }
            }
        }
        return numericFields;
    }

    private static String getShortName(ClassDescriptor cd) {
        return getShortName(cd.getName());
    }

    private static String getShortName(String name) {
        return name.substring(name.lastIndexOf(".") + 1);
    }

    private static boolean isNumericField(DataField field) {
        return field.getType() instanceof IntegerDataType || field.getType() instanceof FloatDataType;
    }

}
