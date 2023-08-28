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

package com.epam.deltix.tbwg.webapp.errors;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.ApiError;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Log LOGGER = LogFactory.getLog(GlobalExceptionHandler.class);

    @ExceptionHandler(WriteOperationsException.class)
    public ResponseEntity<ApiError> handleException(WriteOperationsException e) {
        logException(e);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            new ApiError(e, HttpStatus.FORBIDDEN)
        );
    }

    @ExceptionHandler({ UnknownStreamException.class,
        InvalidQueryException.class,
        InvalidSchemaChangeException.class,
        NoStreamsException.class})
    public ResponseEntity<ApiError> handleException(TimebaseException e) {
        logException(e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            new ApiError(e, HttpStatus.BAD_REQUEST)
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleException(AccessDeniedException e) {
        logException(e);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            new ApiError(e, HttpStatus.FORBIDDEN)
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleException(IllegalArgumentException e) {
        logException(e);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            new ApiError(e, HttpStatus.BAD_REQUEST)
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleException(Exception e) {
        logException(e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            new ApiError(e, HttpStatus.INTERNAL_SERVER_ERROR)
        );
    }

    private void logException(Exception e){
        LOGGER.error()
            .append("Exception handled: ")
            .append(e.getClass().getSimpleName())
            .append(e)
            .commit();
    }
}
