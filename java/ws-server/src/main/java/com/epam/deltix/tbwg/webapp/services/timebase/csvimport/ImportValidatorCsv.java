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

import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.tbwg.webapp.model.input.*;
import com.epam.deltix.tbwg.webapp.utils.CsvImportUtil;

import java.text.SimpleDateFormat;
import java.util.*;

public class ImportValidatorCsv implements ImportValidator {

    private final Map<String, Preview> csvValuesMap;
    private final List<FieldToColumnMapping> mappings;
    private final CsvImportGeneralSettings generalSettings;
    private final CsvValueConvertor convertor;


    public ImportValidatorCsv(RecordClassDescriptor[] descriptors, CsvImportSettings settings, Map<String, Preview> csvValues) {
        this.csvValuesMap = csvValues;
        mappings = settings.getMappings();
        generalSettings = settings.getGeneralSettings();
        convertor = new CsvValueConvertor(descriptors, generalSettings);
    }

    @Override
    public List<FieldMappingValidateResponse> validateMapping(Set<StreamFieldInfo> usedFields) {
        List<FieldMappingValidateResponse> result = new ArrayList<>();
        for (FieldToColumnMapping mapping : mappings) {
            StreamFieldInfo field = mapping.getField();
            if (usedFields != null && !usedFields.contains(field)) continue;
            if (!field.getFieldType().isNullable()) {
                String csvColumnName = mapping.getColumn();
                if (csvColumnName != null) {
                    result.add(new FieldMappingValidateResponse(field, new ValidateResponse(ValidateStatus.VALID)));
                } else if (CommonFields.isCommonField(field)) {
                    result.add(new FieldMappingValidateResponse(field, validateCommonFieldMapping(mapping)));
                } else {
                    result.add(new FieldMappingValidateResponse(field, new ValidateResponse(ValidateStatus.NON_VALID,
                            "Not mapped non-null field " + field.getTitle())));
                }
            } else {
                result.add(new FieldMappingValidateResponse(field, new ValidateResponse(ValidateStatus.VALID)));
            }
        }
        return result;
    }

    private ValidateResponse validateCommonFieldMapping(FieldToColumnMapping mapping) {
        CommonFields commonFields = CommonFields.valueOfFieldInfo(mapping.getField());
        switch (commonFields) {
//            case INSTRUMENT_TYPE:
//                if (generalSettings.getInstrumentType() != null) {
//                    return new ValidateResponse(ValidateStatus.VALID);
//                }
            case KEYWORD:
                if (hasDefaultType(generalSettings.getTypeToKeywordMapping())) {
                    return new ValidateResponse(ValidateStatus.VALID);
                }
            case SYMBOL:
                if (generalSettings.isFileBySymbol()) {
                    return new ValidateResponse(ValidateStatus.VALID);
                }
        }
        return new ValidateResponse(ValidateStatus.NON_VALID,
                "Not mapped non-null field " + mapping.getField().getTitle());
    }

    private static boolean hasDefaultType(Map<String, String> typeToKeywordMapping) {
        return typeToKeywordMapping != null && typeToKeywordMapping.size() == 1;
    }

    @Override
    public Map<String, FieldValidateResponse> checkConvertibility(String fileName) {
        Preview preview = csvValuesMap.get(fileName);
        List<String[]> parseData = preview.getParseData(generalSettings.getSeparator(), generalSettings.getCharset());
        int typeColumnIndex = findTypeColumnIndex(parseData);
        Map<String, FieldValidateResponse> convertFails = new HashMap<>();
        for (FieldToColumnMapping mapping : mappings) {
            String csvColumnName = mapping.getColumn();
            if (csvColumnName != null) {
                int position = CsvImportUtil.findHeaderPosition(parseData, csvColumnName);
                if (position >= 0) {
                    StreamFieldInfo fieldInfo = mapping.getField();
                    Map<Integer, ValidateResponse> validateStatusMap =
                            validateColumn(fieldInfo, parseData, position, typeColumnIndex);
                    convertFails.put(csvColumnName, new FieldValidateResponse(validateStatusMap));
                }
            }
        }
        return convertFails;
    }

    @Override
    public Map<String, Map<String, FieldValidateResponse>> checkConvertibility() {
        Map<String, Map<String, FieldValidateResponse>> result = new HashMap<>(csvValuesMap.size());
        for (String fileName : csvValuesMap.keySet()) {
            Map<String, FieldValidateResponse> convertFails = checkConvertibility(fileName);
            result.put(fileName, convertFails);
        }
        return result;
    }

    public static void settingsValidate(CsvImportSettings settings) {
        CsvImportGeneralSettings generalSettings = settings.getGeneralSettings();
        if (generalSettings == null) {
            throw new IllegalArgumentException("Missing settings");
        }
        List<FieldToColumnMapping> mappings = settings.getMappings();
        if (mappings == null) {
            throw new IllegalArgumentException("Missing mappings");
        }
        settingsValidate(generalSettings);
        if (CsvImportUtil.hasMapping(mappings, CommonFields.KEYWORD.getFieldInfo())
                && generalSettings.getTypeToKeywordMapping() == null) {
            throw new IllegalArgumentException("Missing type mapping property in settings");
        }
        if (!CsvImportUtil.hasMapping(mappings, CommonFields.KEYWORD.getFieldInfo())
                && !hasDefaultType(generalSettings.getTypeToKeywordMapping())) {
            throw new IllegalArgumentException("Missing default message type property in settings");
        }
//        if (!CsvImportUtil.hasMapping(mappings, CommonFields.INSTRUMENT_TYPE.getFieldInfo())
//                && generalSettings.getInstrumentType() == null) {
//            throw new IllegalArgumentException("Missing Instrument type property in settings");
//        }
    }

    public static void settingsValidate(CsvImportGeneralSettings settings) {
        if (settings.getTimeZone() == null) {
            throw new IllegalArgumentException("Missing Time zone property in settings");
        }
        if (settings.getStartImportRow() < 2) {
            throw new IllegalArgumentException("Invalid Start import row property in settings");
        }
        if (settings.getDataTimeFormat() == null) {
            throw new IllegalArgumentException("Missing Data/time format property in settings");
        } else {
            try {
                Date date = new Date();
                SimpleDateFormat sdf = new SimpleDateFormat(settings.getDataTimeFormat());
                String format = sdf.format(date);
                sdf.parse(format);
            } catch (Exception e) {
                throw new IllegalArgumentException("Missing Data/time format property in settings");
            }
        }
        if (settings.getStreamKey() == null) {
            throw new IllegalArgumentException("Missing Stream name property in settings");
        }
        if (settings.getCharset() == null) {
            throw new IllegalArgumentException("Missing Charset property in settings");
        }
    }

    private Map<Integer, ValidateResponse> validateColumn(StreamFieldInfo fieldInfo,
                                                          List<String[]> values,
                                                          int position,
                                                          int typeColumnIndex) {
        Map<Integer, ValidateResponse> validateMap = new HashMap<>(values.size());
        String[] headers = values.get(0);
        for (int i = (generalSettings.getStartImportRow() - 1); i < values.size(); i++) {
            String[] line = values.get(i);
            if (headers.length != line.length){
                String message = "Data format error. The number of values in 'line " + i
                        + "' is different from the header.";
                validateMap.put(i, new ValidateResponse(ValidateStatus.NON_VALID, message));
                continue;
            }
            ValidateResponse validateResponse = convertor.isConvertibleValue(fieldInfo, line,
                    position, typeColumnIndex);
            validateMap.put(i, validateResponse);
        }
        return validateMap;
    }


    private int findTypeColumnIndex(List<String[]> values) {
        return mappings.stream()
                .filter(fieldToColumnMapping -> fieldToColumnMapping.getField().equals(CommonFields.KEYWORD.getFieldInfo()))
                .findFirst()
                .map(FieldToColumnMapping::getColumn)
                .map(s -> CsvImportUtil.findHeaderPosition(values, s)).orElse(-1);
    }
}
