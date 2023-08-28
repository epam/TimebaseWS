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
import com.epam.deltix.tbwg.webapp.model.input.FieldValidateResponse;
import com.epam.deltix.tbwg.webapp.model.input.StreamFieldInfo;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ImportValidator {
    Map<String, FieldValidateResponse> checkConvertibility(String fileName);

    Map<String, Map<String, FieldValidateResponse>> checkConvertibility();

    List<FieldMappingValidateResponse> validateMapping(Set<StreamFieldInfo> usedFields);
}
