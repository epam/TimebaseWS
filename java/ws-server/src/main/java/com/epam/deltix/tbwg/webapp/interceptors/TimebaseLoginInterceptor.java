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
package com.epam.deltix.tbwg.webapp.interceptors;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.TbUserDetails;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.Principal;

@Component
public class TimebaseLoginInterceptor implements HandlerInterceptor {

    private static final Log LOGGER = LogFactory.getLog(TimebaseLoginInterceptor.class);

    private final TimebaseRegistry registry;

    public TimebaseLoginInterceptor(TimebaseRegistry registry) {
        this.registry = registry;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Principal principal = request.getUserPrincipal();
        if (principal != null) {
            TbUserDetails details = TbUserDetails.create(TBWGUtils.getIp(request));
            for (TimebaseService svc : registry.getAll()) {
                try {
                    svc.login(principal, details);
                } catch (AccessDeniedException e) {
                    throw e;
                } catch (Exception e) {
                    LOGGER.warn().append("Failed to login to timebase [").append(svc.getId()).append("]: ")
                            .append(e.getMessage()).commit();
                }
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Principal principal = request.getUserPrincipal();
        if (principal != null) {
            TbUserDetails details = TbUserDetails.create(TBWGUtils.getIp(request));
            for (TimebaseService svc : registry.getAll()) {
                try {
                    svc.logout(principal, details);
                } catch (Exception e) {
                    LOGGER.warn().append("Failed to logout from timebase [").append(svc.getId()).append("]: ")
                            .append(e.getMessage()).commit();
                }
            }
        }
    }

}