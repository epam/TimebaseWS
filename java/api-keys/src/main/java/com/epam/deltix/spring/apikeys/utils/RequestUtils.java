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
package com.epam.deltix.spring.apikeys.utils;

import com.epam.deltix.spring.apikeys.ApiKeysAuthenticationService;
import org.springframework.http.HttpMethod;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;

public class RequestUtils {

    public static String getPayloadFromRequest(HttpServletRequest request, boolean sessionMode) throws IOException {
        StringBuilder payload = new StringBuilder();

        payload.append(request.getMethod().toUpperCase()).append(request.getServletPath().toLowerCase());
        List<String> paramKeys = Collections.list(request.getParameterNames());
        paramKeys.sort(Comparator.naturalOrder());
        for (int i = 0; i < paramKeys.size(); i++) {
            String param = paramKeys.get(i);
            String value = request.getParameter(param);
            payload.append(param.toLowerCase()).append("=").append(value);
            if (i != paramKeys.size() - 1) {
                payload.append("&");
            }
        }

        if (sessionMode) {
            payload.append(ApiKeysAuthenticationService.NONCE_HEADER).append("=").append(getNonceFromRequest(request))
                .append("&").append(ApiKeysAuthenticationService.SESSION_HEADER).append("=").append(getSessionFromRequest(request));
        }
        if (request.getMethod().equals(HttpMethod.POST.name())
                || request.getMethod().equals(HttpMethod.PUT.name())
                || request.getMethod().equals(HttpMethod.DELETE.name())) {
            BufferedReader reader = request.getReader();
            while (true) {
                char[] buffer = new char[512];
                int ret = reader.read(buffer);
                if (ret > 0)
                    payload.append(String.copyValueOf(buffer, 0, ret));
                if (ret != 512)
                    break;
            }
        }

        return payload.toString();
    }

    public static String getHost(HttpServletRequest request) throws URISyntaxException {
        final String host;
        final String forwardedHost = request.getHeader("X-Forwarded-Host");
        if (forwardedHost == null) {
            host = new URI(request.getRequestURL().toString()).getHost();
        } else {
            host = new URI("my://" + forwardedHost).getHost();
        }

        final String schema;
        final String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto == null) {
            schema = "http";
        } else {
            schema = forwardedProto;
        }

        return schema + "://" + host;
    }

    public static String getRemote(HttpServletRequest request) throws URISyntaxException {
        final String remote;
        final String remoteHost = request.getHeader("X-Forwarded-For");
        if (remoteHost == null) {
            remote = request.getRemoteHost();
        } else {
            final String[] list = remoteHost.split(",");
            if (list.length == 0) {
                remote = request.getRemoteHost();
            } else {
                remote = new URI("my://" + list[0].trim()).getHost();
            }
        }
        return remote;
    }

    public static String getApiKeyFromRequest(HttpServletRequest httpRequest) {
        return httpRequest.getHeader(ApiKeysAuthenticationService.API_KEY_HEADER);
    }

    public static String getSignatureFromRequest(HttpServletRequest httpRequest) {
        return httpRequest.getHeader(ApiKeysAuthenticationService.SIGNATURE_HEADER);
    }

    public static String getNonceFromRequest(HttpServletRequest httpRequest) {
        return httpRequest.getHeader(ApiKeysAuthenticationService.NONCE_HEADER);
    }

    public static String getSessionFromRequest(HttpServletRequest httpRequest) {
        return httpRequest.getHeader(ApiKeysAuthenticationService.SESSION_HEADER);
    }
}
