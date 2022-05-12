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
package com.epam.deltix.tbwg.webapp.interceptors;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class RestLogInterceptor extends HandlerInterceptorAdapter {

    private static final Log LOGGER = LogFactory.getLog(RestLogInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            LOGGER.info()
                .append("Request: ").append(request.getMethod()).append(" ").append(request.getRequestURI())
                .append(", User: ").append(request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "Unknown")
                .append(" (").append(request.getRemoteAddr()).append(")")
                .commit();
        } catch (Throwable t) {
            LOGGER.error().append("Error pre handle rest query").append(t).commit();
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            LOGGER.info()
                .append("Complete: ").append(request.getMethod()).append(" ").append(request.getRequestURI())
                .append(", User: ").append(request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "Unknown")
                .append(" (").append(request.getRemoteAddr()).append(")")
                .commit();
        } catch (Throwable t) {
            LOGGER.error().append("Error after completion rest query").append(t).commit();
        }
    }
}
