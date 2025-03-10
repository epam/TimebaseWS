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
package com.epam.deltix.tbwg.webapp.services.timebase.connections;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseServiceImpl;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.time.TimeKeeper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;

@Service
public class TbUserConnectionsService {

    private static final Log LOGGER = LogFactory.getLog(TimebaseServiceImpl.class);

    private final ThreadLocal<TbUser> localUser = new ThreadLocal<>();
    private final Map<TbUser, Connection> connections = new HashMap<>();

    @Value("${timebase.user-connections.connection-timeout-sec:300}")
    private long connectionTimeoutSec;

    private static class Connection {
        private final DXTickDB db;
        private final TbUser user;
        private volatile long expirationTimestamp;

        private final Set<String> sessions = new HashSet<>();

        private Connection(DXTickDB db, TbUser user) {
            this.db = db;
            this.user = user;
        }

        private boolean isStale() {
            return sessions.isEmpty() && TimeKeeper.currentTime >= expirationTimestamp;
        }

        private void keepAlive(long expirationTimestamp) {
            this.expirationTimestamp = expirationTimestamp;
        }

        private void addSession(String sessionId) {
            sessions.add(sessionId);
        }

        private void removeSession(String sessionId) {
            sessions.remove(sessionId);
        }

        @Override
        public String toString() {
            return "UserConnection[" +
                "user: " + user +
                "; expirationTimestamp: " + Instant.ofEpochMilli(expirationTimestamp) +
                ", opened sessions count: " + sessions.size() +
                ']';
        }
    }

    @Scheduled(fixedDelayString = "${timebase.user-connections.clear-connections-period-ms:60000}")
    public synchronized void clearStaledConnections() {
        List<TbUser> removeUsers = new ArrayList<>();
        connections.forEach((user, connection) -> {
            if (connection.isStale()) {
                removeUsers.add(user);
                Util.close(connection.db);
                LOGGER.info().append("Connection for user ").append(user).append(" staled and closed").commit();
            }
        });

        removeUsers.forEach(connections::remove);

        if (!connections.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            connections.forEach((u, c) -> sb.append(c.toString()).append("\n"));
            LOGGER.info().append("Opened connections: \n").append(sb.toString()).commit();
        }
    }

    public synchronized DXTickDB connect(TbUser user, Function<DXTickDB, DXTickDB> connectIfNeed) {
        Connection connection = connections.get(user);
        DXTickDB dbConnection = connection != null ? connection.db : null;
        DXTickDB newDbConnection = connectIfNeed.apply(dbConnection);
        if (dbConnection != newDbConnection) {
            connections.put(user, connection = new Connection(newDbConnection, user));
        }
        connection.keepAlive(TimeKeeper.currentTime + connectionTimeoutSec * 1000);
        return newDbConnection;
    }

    public void login(@NotNull TbUser user) {
        localUser.set(user);
    }

    public void logout() {
        localUser.remove();
    }

    public synchronized void openSession(TbUser user, String sessionId) {
        Connection connection = connections.get(user);
        if (connection != null) {
            connection.addSession(sessionId);
            LOGGER.info().append("Open session (").append(sessionId).append(") for user ").append(user).commit();
        } else {
            throw new IllegalStateException("Can't find connection for user " + user);
        }
    }

    public synchronized void closeSession(TbUser user, String sessionId) {
        Connection connection = connections.get(user);
        if (connection != null) {
            connection.removeSession(sessionId);
            LOGGER.info().append("Close session (").append(sessionId).append(") for user ").append(user).commit();
        } else {
            throw new IllegalStateException("Can't find connection for user " + user);
        }
    }

    public TbUser loggedInUser() {
        return localUser.get();
    }

    public synchronized void close() {
        connections.values().forEach(c -> Util.close(c.db));
        connections.clear();
    }

}