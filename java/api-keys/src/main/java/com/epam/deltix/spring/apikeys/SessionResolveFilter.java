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
package com.epam.deltix.spring.apikeys;

import com.epam.deltix.spring.apikeys.errors.ExceptionRenderer;
import com.epam.deltix.spring.apikeys.errors.ExceptionTranslator;
import com.epam.deltix.spring.apikeys.utils.RequestUtils;
import com.epam.deltix.spring.apikeys.utils.RequestWrapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;

public class SessionResolveFilter extends OncePerRequestFilter implements ApiKeysFilter {

    private final ExceptionTranslator exceptionTranslator = new ExceptionTranslator();
    private final ExceptionRenderer exceptionRenderer = new ExceptionRenderer();

    private final ApiKeysAuthenticationService authenticationService;

    public SessionResolveFilter(ApiKeysAuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        RequestWrapper request = new RequestWrapper(req);
        try {
            final String sessionId = RequestUtils.getSessionFromRequest(request);
            final String nonce = RequestUtils.getNonceFromRequest(request);
            if (sessionId != null) {
                Authentication authentication = authenticationService.authenticate(sessionId,
                    RequestUtils.getPayloadFromRequest(request, true),
                    RequestUtils.getSignatureFromRequest(request),
                    nonce
                );
                if (authentication != null) {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Throwable e) {
            SecurityContextHolder.clearContext();
            exceptionRenderer.handleHttpEntityResponse(
                exceptionTranslator.translate(e),
                response
            );
            return;
        }
        chain.doFilter(request, response);
    }

}
