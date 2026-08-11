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
package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.data.stream.DXChannel;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.spi.conn.DisconnectEventListener;
import com.epam.deltix.qsrv.hf.spi.conn.Disconnectable;
import com.epam.deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.TopicDB;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.DetailedTbUser;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.TbUser;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.TbUserConnectionsService;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.TbUserDetails;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.webapp.settings.Oauth2ClientSettings;
import com.epam.deltix.tbwg.webapp.settings.TimebaseSettings;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.lang.StringUtils;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.oauth.KeystoreConfig;
import com.epam.deltix.util.oauth.Oauth2Client;
import com.epam.deltix.util.oauth.Oauth2ClientConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.security.Principal;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;
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
    private volatile String lastError = null;

    private final TbUserConnectionsService userConnectionsService;

    private final TimebaseSettings timebaseSettings;
    private final SystemMessagesService systemMessagesService;

    @Autowired
    public TimebaseServiceImpl(TimebaseSettings timebaseSettings,
                               SystemMessagesService systemMessagesService,
                               TbUserConnectionsService userConnectionsService) {

        this.timebaseSettings = timebaseSettings;
        this.systemMessagesService = systemMessagesService;
        this.userConnectionsService = userConnectionsService;
    }

    @Override
    public String getServerVersion() {
        if (serverVersion == null) {
            try {
                getConnection();
            } catch (Exception ex) {
                lastError = describeError(ex);
            }
        }
        return serverVersion;
    }

    @Override
    public boolean      isConnected() {
        try {
            boolean connected = ((TickDBClient)getConnection()).isConnected();
            if (connected) {
                lastError = null;
            }
            return connected;
        } catch (Exception ex) {
            lastError = describeError(ex);
            return false;
        }
    }

    @Override
    public String getLastError() {
        return lastError;
    }

    private static String describeError(Throwable e) {
        return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
    }

    @Override
    public String getId() {
        String configuredId = timebaseSettings.getId();
        if (configuredId != null && !configuredId.isEmpty()) {
            return configuredId;
        }
        return db != null ? db.getId() : null;
    }

    @Override
    public String getUrl() {
        return timebaseSettings.getUrl();
    }

    @Override
    public TopicDB getTopicDB() {
        return getConnection().getTopicDB();
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
            String decoded = !StringUtils.isEmpty(password) ? new String(Base64.getDecoder().decode(password)) : null;
            db = !StringUtils.isEmpty(userName) ? TickDBFactory.createFromUrl(url, userName, decoded) : TickDBFactory.createFromUrl(url);

            if (timebaseSettings.isOauth2ClientConfigured() && db instanceof TickDBClient) {
                Oauth2ClientSettings oauth2ClientSettings = timebaseSettings.getOauth2Client();

                Oauth2ClientConfig.Builder builder = Oauth2ClientConfig.builder().withUrl(oauth2ClientSettings.getUrl());
                if (oauth2ClientSettings.isKeystoreConfigured()) {
                    if (oauth2ClientSettings.getKeystore().getKeystoreType().equalsIgnoreCase("PKCS12")) {
                        builder.withClientCredentials(
                            oauth2ClientSettings.getClientId(),
                            KeystoreConfig.builder().withPkcs12(
                                oauth2ClientSettings.getKeystore().getKeystoreLocation(),
                                oauth2ClientSettings.getKeystore().getKeystoreAlias(),
                                new String(Base64.getDecoder().decode(oauth2ClientSettings.getKeystore().getKeystorePassword()))
                            ).build()
                        );
                    } else {
                        builder.withClientCredentials(
                            oauth2ClientSettings.getClientId(),
                            KeystoreConfig.builder().withJks(
                                oauth2ClientSettings.getKeystore().getKeystoreLocation(),
                                oauth2ClientSettings.getKeystore().getKeystoreAlias(),
                                new String(Base64.getDecoder().decode(oauth2ClientSettings.getKeystore().getKeystorePassword()))
                            ).build()
                        );
                    }
                } else {
                    builder.withClientCredentials(
                        oauth2ClientSettings.getClientId(),
                        new String(Base64.getDecoder().decode(oauth2ClientSettings.getClientSecret()))
                    );
                }

                if (oauth2ClientSettings.getScope() != null) {
                    builder = builder.withParameter("scope", oauth2ClientSettings.getScope());
                }

                ((TickDBClient) db).setOauth2Client(Oauth2Client.create(builder.build()));
            }

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
                ((DBStateNotifier) db).addStateListener(systemMessagesService.getStateListenerForTb(getId()));
            } else {
                LOGGER.error().append("Cannot add ")
                        .append(DBStateListener.class.getSimpleName())
                        .commit();
            }
        }
        return db;
    }

    public synchronized DXTickDB getOrCreateUserConnection(TbUser user) {
        String url = timebaseSettings.getUrl();
        return userConnectionsService.connect(user, connection -> {
            DXTickDB userConnection = connection;
            if (userConnection == null || isNotConnected(userConnection)) {
                Util.close(userConnection);

                String userName = user.getName();
                userConnection = TickDBFactory.createFromUrl(url, userName, user.getToken());
                TickDBFactory.setApplicationName(userConnection, "TB Web Gateway (" + user + ")");
                if (timebaseSettings.getUac().isConnectionPerIp()) {
                    setExternalAddress(userConnection, user);
                }

                LOGGER.info("Opening connection to TimeBase on %s (User: %s).").with(url).with(user);
                userConnection.open(timebaseSettings.isReadonly());

                if (userConnection instanceof Disconnectable) {
                    ((Disconnectable) userConnection).addDisconnectEventListener(new EventListener(userConnection));
                    LOGGER.info("Subscribe to disconnect event on %s (User: %s).").with(url).with(user);
                }

                if (userConnection instanceof DBStateNotifier) {
                    ((DBStateNotifier) userConnection).addStateListener(systemMessagesService.getStateListener(userName));
                } else {
                    LOGGER.error().append("Cannot add ")
                        .append(DBStateListener.class.getSimpleName())
                        .commit();
                }
            }

            if (userConnection instanceof TickDBClient) {
                ((TickDBClient) userConnection).setAccessToken(user.getToken());
            }

            return userConnection;
        });
    }

    private void setExternalAddress(DXTickDB connection, TbUser user) {
        if (connection instanceof TickDBClient) {
            TickDBClient client = (TickDBClient) connection;
            if (user instanceof DetailedTbUser) {
                TbUserDetails details = ((DetailedTbUser) user).getDetails();
                if (details == null || details.getIp() == null || details.getIp().isEmpty()) {
                    throw new IllegalStateException("Unknown user (" + user + ") IP address.");
                }

                client.setExternalAddress(details.getIp());
            } else {
                throw new IllegalStateException("Unknown user (" + user + ") details.");
            }
        }
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
        userConnectionsService.close();
        LOGGER.info("Connection closed.");
    }

    public boolean          isReadonly() {
        return timebaseSettings.isReadonly();
    }

    public long getFlushPeriodMs() {
        return timebaseSettings.getFlushPeriodMs();
    }

    public DXTickDB         getConnection() {
        TbUser user = userConnectionsService.loggedInUser();
        if (user != null) {
            return getOrCreateUserConnection(user);
        }

        return getOrCreate(timebaseSettings.getUrl(), timebaseSettings.getUser(), timebaseSettings.getPassword());
    }

    @Override
    public DXTickDB login(Principal principal, TbUserDetails details) {
        if (timebaseSettings.isEnableUac()) {
            if (principal instanceof JwtAuthenticationToken) {
                JwtAuthenticationToken token = (JwtAuthenticationToken) principal;
                TbUser user = createTbUser(principal, token, details);
                userConnectionsService.login(user);
                return getOrCreateUserConnection(user);
            } else {
                userConnectionsService.logout();
                throw new AccessDeniedException("OAuth2 token authentication required");
            }
        }

        return getConnection();
    }

    @Override
    public void logout(Principal principal, TbUserDetails userDetails) {
        if (timebaseSettings.isEnableUac()) {
            userConnectionsService.logout();
        }
    }

    @Override
    public void openSession(Principal principal, TbUserDetails details, String sessionId) {
        if (timebaseSettings.isEnableUac()) {
            if (principal instanceof JwtAuthenticationToken) {
                JwtAuthenticationToken token = (JwtAuthenticationToken) principal;
                userConnectionsService.openSession(createTbUser(principal, token, details), sessionId);
            } else {
                throw new AccessDeniedException("OAuth2 token authentication required");
            }
        }
    }

    @Override
    public void closeSession(Principal principal, TbUserDetails details, String sessionId) {
        if (timebaseSettings.isEnableUac()) {
            if (principal instanceof JwtAuthenticationToken) {
                JwtAuthenticationToken token = (JwtAuthenticationToken) principal;
                userConnectionsService.closeSession(createTbUser(principal, token, details), sessionId);
            } else {
                throw new AccessDeniedException("OAuth2 token authentication required");
            }
        }
    }

    private TbUser createTbUser(Principal principal, JwtAuthenticationToken token, TbUserDetails details) {
        if (timebaseSettings.getUac().isConnectionPerIp()) {
            if (details == null || details.getIp() == null || details.getIp().isEmpty()) {
                throw new IllegalArgumentException("Unknown principal (" + principal.getName() + ") IP address.");
            }

            return DetailedTbUser.create(principal.getName(), token.getToken().getTokenValue(), details);
        } else {
            return TbUser.create(principal.getName(), token.getToken().getTokenValue());
        }
    }

    public DXChannel[]      listChannels() {
        DXChannel[] streams = getConnection().listChannels();

        return Arrays.stream(streams).filter(x -> !x.getKey().contains("#")).toArray(DXChannel[]::new);
    }

    public DXTickStream getStreamChecked(String key) throws UnknownStreamException {
        DXTickStream stream = getStream(key);
        if (stream == null)
            throw new UnknownStreamException(key);
        return stream;
    }

    public DXTickStream getSystemStream(String key) throws UnknownStreamException {
        DXTickStream stream = getConnection().getStream(key);
        if (stream == null)
            throw new UnknownStreamException(key);

        return stream;
    }


    public DXTickStream     getStream(String key) {
        DXTickStream stream = getConnection().getStream(key);
        if (stream != null && timebaseSettings.isMatched(key))
            return stream;

        return null;
    }

    public DXTickStream getOrCreateStream(String key, Class<?>... classes) {
        return getOrCreateStream(key, (options) -> options.scope = StreamScope.DURABLE, classes);
    }

    @Override
    public DXTickStream getOrCreateStream(String key, RecordClassDescriptor... descriptors) {
        return getOrCreateStream(key, (options) -> options.scope = StreamScope.DURABLE, descriptors);
    }

    public DXTickStream getOrCreateStream(String key, Consumer<StreamOptions> optionsProcessor, Class<?>... classes) {
        DXTickStream stream = getConnection().getStream(key);
        if (stream == null) {
            stream = createStream(key, optionsProcessor, introspectClasses(classes));
        }

        return stream;
    }

    public DXTickStream getOrCreateStream(String key, Consumer<StreamOptions> optionsProcessor, RecordClassDescriptor... descriptors) {
        DXTickStream stream = getConnection().getStream(key);
        if (stream == null) {
            stream = createStream(key, optionsProcessor, descriptors);
        }

        return stream;
    }

    private DXTickStream createStream(String key, Consumer<StreamOptions> optionsProcessor, RecordClassDescriptor... descriptors) {
        LOGGER.info().append("Stream ").append(key).append(" not found.").commit();
        LOGGER.info("Creating new stream.");
        StreamOptions options = new StreamOptions(StreamScope.DURABLE, key, "", 1);
        optionsProcessor.accept(options);
        options.setPolymorphic(descriptors);
        DXTickStream stream = getConnection().createStream(key, options);
        LOGGER.info().append("Stream ").append(key).append(" created.").commit();

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