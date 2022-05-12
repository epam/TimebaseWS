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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.tbwg.webapp.model.qql.FunctionArgumentDef;
import com.epam.deltix.tbwg.webapp.model.qql.FunctionDef;
import com.epam.deltix.tbwg.webapp.model.schema.DataTypeDef;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ObjectMappingUtils {

    public static FunctionDef convertFunctionDef(Map<String, Object> values) {
        FunctionDef functionDef = new FunctionDef();

        Object nameObj = values.get("name");
        if (nameObj instanceof String) {
            functionDef.setName(nameObj.toString());
        }

        Object returnTypeObj = values.get("returnType");
        if (returnTypeObj instanceof Map) {
            functionDef.setReturnType(convertDataType(((Map<String, Object>) returnTypeObj)));
        }

        Object argumentsObj = values.get("arguments");
        if (argumentsObj instanceof Object[]) {
            List<FunctionArgumentDef> functionArguments = new ArrayList<>();
            Object[] argumentsArr = (Object[]) argumentsObj;
            for (int i = 0; i < argumentsArr.length; ++i) {
                Object argumentObj = argumentsArr[i];
                if (argumentObj instanceof Map) {
                    functionArguments.add(
                        convertFunctionArgument((Map<String, Object>) argumentObj)
                    );
                }
            }

            functionDef.setArguments(functionArguments);
        }

        Object initArgumentsObj = values.get("initArguments");
        if (initArgumentsObj instanceof Object[]) {
            List<FunctionArgumentDef> functionArguments = new ArrayList<>();
            Object[] argumentsArr = (Object[]) initArgumentsObj;
            for (int i = 0; i < argumentsArr.length; ++i) {
                Object argumentObj = argumentsArr[i];
                if (argumentObj instanceof Map) {
                    functionArguments.add(
                        convertFunctionArgument((Map<String, Object>) argumentObj)
                    );
                }
            }

            functionDef.setInitArguments(functionArguments);
        }

        return functionDef;
    }

    private static DataTypeDef convertDataType(Map<String, Object> returnType) {
        if (returnType != null) {
            Object baseNameObj = returnType.get("baseName");
            Object encodingObj = returnType.get("encoding");
            return new DataTypeDef(
                baseNameObj != null ? baseNameObj.toString() : null,
                encodingObj != null ? encodingObj.toString() : null,
                true
            );
        }

        return null;
    }

    private static FunctionArgumentDef convertFunctionArgument(Map<String, Object> functionArgument) {
        if (functionArgument != null) {
            Object nameObj = functionArgument.get("name");
            Object dataTypeObj = functionArgument.get("dataType");
            Object defaultObj = functionArgument.get("defaultValue");
            return new FunctionArgumentDef(
                nameObj != null ? nameObj.toString() : null,
                dataTypeObj instanceof Map ? convertDataType((Map<String, Object>) dataTypeObj) : null,
                defaultObj != null ? defaultObj.toString() : null
            );
        }

        return null;
    }

}
