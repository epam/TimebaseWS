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

package com.epam.deltix.tbwg.webapp.interceptors;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.MetricsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class AuthenticationEventListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private static final Log LOGGER = LogFactory.getLog(AuthenticationEventListener.class);

    private static final String BASIC_AUTH_USER = "web";
    private static final String ACTIVE_USERS_METRIC = "users.active";


    private final AtomicLong activeUsersMetric;

    private final Map<String, AtomicLong> userToLoginTime = new HashMap<>();

    @Value("${metrics.users.active.timeout-ms:300000}")
    private long timeoutMs;

    public AuthenticationEventListener(MetricsService metricsService) {
        activeUsersMetric = metricsService.longGauge(ACTIVE_USERS_METRIC);
    }

    @Scheduled(fixedDelayString = "10000")
    public void reload() {
        clearStaleUsers();
    }

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        Authentication authentication = event.getAuthentication();
        Object principalObj = authentication.getPrincipal();
        if (principalObj instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) principalObj;
            String username = userDetails.getUsername();
            LOGGER.info().append("Login: ").append(userDetails.getUsername()).commit();

            if (username != null && !BASIC_AUTH_USER.equals(username)) {
                refreshLoginTime(username);
            }
        } else if (principalObj instanceof String) {
            refreshLoginTime((String) principalObj);
        }
    }

    private void refreshLoginTime(String user) {
        synchronized (userToLoginTime) {
            userToLoginTime.computeIfAbsent(user, k -> new AtomicLong()).set(System.currentTimeMillis());
        }
        updateActiveUsersMetric();
    }

    private void clearStaleUsers() {
        synchronized (userToLoginTime) {
            long currentTime = System.currentTimeMillis();
            userToLoginTime.entrySet().removeIf(e -> (currentTime - e.getValue().get()) > timeoutMs);
        }
        updateActiveUsersMetric();
    }

    private void updateActiveUsersMetric() {
        activeUsersMetric.set(userToLoginTime.size());
    }
}
