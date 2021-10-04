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
package com.epam.deltix.tbwg.utils;

import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;

public class ExceptionToHttpStatusConverter {
    public static HttpStatus getStatus(Throwable ex) {
        final HttpStatus ret = getStatusOrNull(ex);
        if (ret == null)
            return HttpStatus.INTERNAL_SERVER_ERROR;
        return ret;
    }

    private static HttpStatus getStatusOrNull(Throwable ex) {
        final Throwable cause = ex.getCause();
        if (cause != null && cause != ex)
            return getStatusOrNull(cause);
        if (ex instanceof AccessDeniedException)
            return HttpStatus.UNAUTHORIZED;
        if (ex instanceof ConversionFailedException)
            return HttpStatus.BAD_REQUEST;
        return null;
    }
}
