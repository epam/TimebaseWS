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

package com.epam.deltix.tbwg.webapp.services.oid;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.epam.deltix.containers.ObjToObjHashMap;

@Service
@Lazy
public class UserInfoServiceImpl implements UserInfoService {
    private static final Log LOG = LogFactory.getLog(UserInfoServiceImpl.class);

    private static final long NANOSECONDS_IN_MILLISECOND = 1_000_000L;
    private final long keepAliveTimerThresholdNs = 60_000 * NANOSECONDS_IN_MILLISECOND;

    private final OpenIdAuthProvider openIdAuthProvider;

    private final Object sync = new Object();
    // Token -> sub
    private final ObjToObjHashMap<String, Sub> cachedSub = new ObjToObjHashMap<>(null);
    // sub -> UserName
    private final ObjToObjHashMap<String, UserName> cachedUserNames = new ObjToObjHashMap<>(null);

    @Scheduled(fixedRateString = "${systemService.keepAliveTimerMs:60000}")
    public void cleanUserNamesTimer() {
        long st = System.nanoTime();

        try {
            long now = System.currentTimeMillis();

            synchronized (sync) {
                long it = cachedSub.getFirst();
                while (it != ObjToObjHashMap.NO_ELEMENT) {
                    final Sub userName = cachedSub.getValueAt(it);
                    if (userName.getExpiration() < now) {
                        it = cachedSub.removeAt(it);
                    } else {
                        it = cachedSub.getNext(it);
                    }
                }

                it = cachedUserNames.getFirst();
                while (it != ObjToObjHashMap.NO_ELEMENT) {
                    final UserName userName = cachedUserNames.getValueAt(it);
                    if (userName.getExpiration() < now) {
                        it = cachedUserNames.removeAt(it);
                    } else {
                        it = cachedUserNames.getNext(it);
                    }
                }
            }
        } catch (Throwable ex) {
            LOG.error().append("Unexpected exception in cleanUserNamesTimer: ").append(ex).commit();
        } finally {
            long et = System.nanoTime();
            if (et - st > keepAliveTimerThresholdNs) {
                LOG.warn().append("cleanUserNamesTimer took too much time to execute: ").append((et - st) / 1_000_000_000.0).append("s").commit();
            }
        }
    }

    @Autowired
    public UserInfoServiceImpl(OpenIdAuthProvider openIdAuthProvider) {
        this.openIdAuthProvider = openIdAuthProvider;
    }

    @Override
    public String getUsername(String token, String subStr, long exp) {
        // 1. Check cache
        // 2. Insert cache(sub)
        final Sub sub;
        synchronized (sync) {
            long it = cachedSub.locateOrReserve(token);
            if (it == cachedSub.getReservedSpace()) {
                sub = new Sub(subStr, exp);
                cachedSub.setKeyAt(it, token);
                cachedSub.setValueAt(it, sub);
            } else {
                sub = cachedSub.getValueAt(it);
            }
            final UserName username = cachedUserNames.get(sub.getSub());
            if (username != null)
                return username.getUsername();
        }

        // 3. Check userinfo
        LOG.debug().append("/userinfo request: ").append(token).commit();
        String usernameStr = openIdAuthProvider.getUsername(token);
        if (usernameStr == null)
            throw new IllegalStateException("Couldn't extract username from token.");

        // 4. Insert cache(username)
        synchronized (sync) {
            final UserName username;
            long it = cachedUserNames.locateOrReserve(sub.getSub());
            if (it == cachedUserNames.getReservedSpace()) {
                try {
                    username = new UserName(usernameStr, exp);
                } catch (Throwable ex) {
                    cachedUserNames.removeAt(it);
                    throw ex;
                }
                cachedUserNames.setKeyAt(it, sub.getSub());
                cachedUserNames.setValueAt(it, username);
            } else {
                username = cachedUserNames.getValueAt(it);
                if (exp > username.getExpiration())
                    username.setExpiration(exp);
            }
            return username.getUsername();
        }
    }

    private static class Sub {
        private final String sub;
        private final long expiration;

        Sub(String sub, long expiration) {
            this.sub = sub;
            this.expiration = expiration;
        }

        String getSub() {
            return sub;
        }

        long getExpiration() {
            return expiration;
        }
    }

    private static class UserName {
        private final String username;
        private long expiration;

        UserName(String username, long expiration) {
            this.username = username;
            this.expiration = expiration;
        }

        String getUsername() {
            return username;
        }

        long getExpiration() {
            return expiration;
        }

        void setExpiration(long expiration) {
            this.expiration = expiration;
        }
    }
}
