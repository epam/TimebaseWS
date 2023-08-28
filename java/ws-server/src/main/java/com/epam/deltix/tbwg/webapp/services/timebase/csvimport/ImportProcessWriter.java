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
package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportEventType;
import com.epam.deltix.util.lang.Disposable;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class ImportProcessWriter implements Disposable {

    private Writer writer;
    private ZipOutputStream zipOS;
    private boolean error;
    private String errorMessage;

    public String getErrorMessage() {
        return errorMessage;
    }

    public boolean hasError() {
        return error;
    }

    public ImportProcessWriter(File file) {
        try {
            FileOutputStream fos = new FileOutputStream(file);
            zipOS = new ZipOutputStream(fos);
            zipOS.putNextEntry(new ZipEntry(file.getName()));
            writer = new OutputStreamWriter(zipOS, StandardCharsets.UTF_8);
        } catch (IOException e) {
            error = true;
            errorMessage = e.getMessage();
        }
    }

    public void write(String message, ImportEventType type) {
        if (!error){
            try {
                writer.write(String.format("%tF %tT %s, Message: %s\n", System.currentTimeMillis(), System.currentTimeMillis(), type.toString(), message));
                writer.flush();
            } catch (IOException e) {
                error = true;
                errorMessage = e.getMessage();
            }
        }
    }

    @Override
    public void close() {
        if (zipOS != null){
            try {
                zipOS.closeEntry();
            } catch (IOException e) {
                error = true;
                errorMessage = e.getMessage();
            }
        }
        if (writer != null) {
            try {
                writer.close();
            } catch (IOException e) {
                error = true;
                errorMessage = e.getMessage();
            }
        }
    }
}
