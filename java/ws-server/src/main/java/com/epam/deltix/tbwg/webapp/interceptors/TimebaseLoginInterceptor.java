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

import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseLoginService;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.TbUserDetails;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.security.Principal;

@Component
public class TimebaseLoginInterceptor implements HandlerInterceptor {

    private final TimebaseLoginService timebaseLoginService;

    public TimebaseLoginInterceptor(TimebaseLoginService timebaseLoginService) {
        this.timebaseLoginService = timebaseLoginService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Principal principal = request.getUserPrincipal();
        if (principal != null) {
            timebaseLoginService.login(request.getUserPrincipal(), TbUserDetails.create(TBWGUtils.getIp(request)));
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Principal principal = request.getUserPrincipal();
        if (principal != null) {
            timebaseLoginService.logout(request.getUserPrincipal(), TbUserDetails.create(TBWGUtils.getIp(request)));
        }
    }

}