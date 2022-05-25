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

import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class RequestWrapper extends HttpServletRequestWrapper implements HttpServletRequest, ServletRequest {
    private String body = null;

    public RequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public BufferedReader getReader() throws IOException {
        if (body == null) {
            BufferedReader reader = super.getReader();
            body = getRequestData(reader);
        }
        Reader inputString = new StringReader(body);
        return new BufferedReader(inputString);
    }

    @Override
    public ServletInputStream getInputStream() throws IOException {
        getReader();
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8));
        return new ServletInputStream(){
            @Override
            public boolean isFinished() {
                return false;
            }

            @Override
            public boolean isReady() {
                return true;
            }

            @Override
            public void setReadListener(ReadListener listener) {
            }

            public int read() {
                return byteArrayInputStream.read();
            }
        };
    }

    private static String getRequestData(final BufferedReader reader) throws IOException {
        StringBuilder payload = new StringBuilder();
        while (true) {
            char[] buffer = new char[512];
            int ret = reader.read(buffer);
            if (ret >= 0)
                payload.append(String.copyValueOf(buffer, 0, ret));
            else
                break;
        }
        return payload.toString();
    }
}
