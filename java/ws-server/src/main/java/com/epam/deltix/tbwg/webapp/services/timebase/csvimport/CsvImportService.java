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

import com.epam.deltix.tbwg.webapp.model.input.FieldMappingValidateResponse;
import com.epam.deltix.tbwg.webapp.model.input.FieldToColumnMapping;
import com.epam.deltix.tbwg.webapp.model.input.FieldValidateResponse;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface CsvImportService {

    long reserveUploadProcess(String id, long totalSize);

    long uploadChunk(long id, InputStream is, String fileName);

    void saveSettings(String id, CsvImportSettings settings);

    void cancelImport(String id);

    void checkId(String id);

    List<FieldMappingValidateResponse> validateMapping(CsvImportSettings settings, String id);

    Map<String, FieldValidateResponse> validate(CsvImportSettings settings, String id, String fileName);

    Map<String, Map<String, FieldValidateResponse>> validate(CsvImportSettings settings, String id);

    long getProcessId(String id);

    void startImport(long processId, CsvImportSettings settings, SubscriptionChannel channel);

    CsvImportSettings generateDefaultSettings(String id, String streamKey);

    String initImport();

    void addPreview(String id, MultipartFile files, boolean fullFile);

    void removePreviews(String id, List<String> filesName);

    void finishImport(String id);

    List<String[]> getPreviewFileData(String id, String fileName, CsvImportSettings settings);

    CsvImportSettings getSettings(String id);

    Set<String> getHeadersSet(String id, char separator, String charset);

    List<FieldToColumnMapping> getMappings(String id, CsvImportGeneralSettings settings);

    StreamingResponseBody getImportLog(String id);
}
