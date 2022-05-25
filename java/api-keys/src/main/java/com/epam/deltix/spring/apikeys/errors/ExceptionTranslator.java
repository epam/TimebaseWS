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
package com.epam.deltix.spring.apikeys.errors;

import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

public class ExceptionTranslator {

    public ResponseEntity<ApiError> translate(Throwable e) {
        HttpStatus status = getStatus(e);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Cache-Control", "no-store");
        headers.set("Pragma", "no-cache");

        return new ResponseEntity<>(new ApiError(status.getReasonPhrase(), e.getMessage()), headers, status);
    }

    private HttpStatus getStatus(Throwable ex) {
        HttpStatus ret = getStatusOrNull(ex);
        if (ret != null) {
            return ret;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private HttpStatus getStatusOrNull(Throwable ex) {
        final Throwable cause = ex.getCause();
        if (cause != null && cause != ex) {
            return getStatusOrNull(cause);
        }

        if (ex instanceof BadCredentialsException || ex instanceof AccessDeniedException) {
            return HttpStatus.UNAUTHORIZED;
        }
        if (ex instanceof ConversionFailedException
            || ex instanceof IllegalArgumentException
            || ex instanceof IllegalStateException
            || ex instanceof InsufficientAuthenticationException)
        {
            return HttpStatus.BAD_REQUEST;
        }

        return null;
    }
}
