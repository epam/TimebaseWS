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
package com.epam.deltix.tbwg.webapp.services.grafana;

import com.epam.deltix.gflog.api.LogEntry;
import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.tbwg.webapp.services.grafana.base.FunctionsService;
import com.epam.deltix.tbwg.webapp.services.grafana.exc.NoSuchFunctionException;
import com.epam.deltix.tbwg.webapp.services.grafana.util.ExtendedArguments;
import com.epam.deltix.tbwg.webapp.services.grafana.util.ExtendedArgumentsMap;
import com.epam.deltix.tbwg.webapp.settings.GrafanaSettings;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.grafana.aggs.GrafanaFunctionDef;
import com.epam.deltix.tbwg.webapp.model.grafana.queries.SelectQuery;
import com.epam.deltix.tbwg.webapp.services.grafana.exc.ConstantParseException;
import com.epam.deltix.tbwg.webapp.services.grafana.exc.SymbolNotSetException;
import com.epam.deltix.tbwg.webapp.services.grafana.exc.ValidationException;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.grafana.GroupByAggregation;
import com.epam.deltix.grafana.PeekFieldAggregation;
import com.epam.deltix.grafana.RuntimeJoiningAggregation;
import com.epam.deltix.grafana.base.Aggregation;
import org.reflections.Reflections;
import org.reflections.scanners.SubTypesScanner;
import org.reflections.scanners.TypeAnnotationsScanner;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.lang.reflect.Constructor;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class FunctionsServiceImpl implements FunctionsService {

    private static final Log LOG = LogFactory.getLog(FunctionsServiceImpl.class);

    private final Reflections reflections;

    private final ObjectToObjectHashMap<String, Class<? extends Aggregation>> aggregations = new ObjectToObjectHashMap<>();
    private final List<GrafanaFunctionDef> functionDefs = new ObjectArrayList<>();

    public FunctionsServiceImpl(GrafanaSettings grafanaSettings) {
        reflections = new Reflections(new TypeAnnotationsScanner(), new SubTypesScanner(), grafanaSettings.getPluginsPackages());
    }

    @PostConstruct
    public void postConstruct() {
        reflections.getTypesAnnotatedWith(GrafanaAggregation.class).stream()
                .filter(this::validateClass)
                .forEach(clazz -> {
                    GrafanaAggregation grafanaAggregation = clazz.getAnnotation(GrafanaAggregation.class);
                    GrafanaFunctionDef def = GrafanaFunctionDef.create(grafanaAggregation);
                    functionDefs.add(def);
                    aggregations.put(def.getId(), clazz.asSubclass(Aggregation.class));
                });
        reflections.getTypesAnnotatedWith(GrafanaFunction.class).stream()
                .filter(this::validateClass)
                .forEach(clazz -> {
                    GrafanaFunction grafanaFunction = clazz.getAnnotation(GrafanaFunction.class);
                    GrafanaFunctionDef def = GrafanaFunctionDef.create(grafanaFunction);
                    functionDefs.add(def);
                    aggregations.put(def.getId(), clazz.asSubclass(Aggregation.class));
                });
        List<String> list = functionDefs.stream().filter(GrafanaFunctionDef::isAggregation)
                .map(GrafanaFunctionDef::getId)
                .sorted()
                .collect(Collectors.toList());
        LogEntry entry = LOG.info().append("Collected ").append(list.size()).append(" grafana aggregations:\n");
        for (String function : list) {
            entry = entry.append(function).append('\n');
        }
        entry.commit();
        list = functionDefs.stream().filter(def -> !def.isAggregation())
                .map(GrafanaFunctionDef::getId)
                .sorted()
                .collect(Collectors.toList());
        entry = LOG.info().append("Collected ").append(list.size()).append(" grafana functions:\n");
        for (String function : list) {
            entry = entry.append(function).append('\n');
        }
        entry.commit();
    }

    @Override
    public List<GrafanaFunctionDef> listFunctions(String stream) {
        return functionDefs;
    }

    @Override
    public final Aggregation aggregation(SelectQuery selectQuery, long start, long end, long interval,
                                         List<SelectQuery.TimebaseField> groupBy, List<String> symbols)
            throws ValidationException {
        List<Function<GenericRecord, Aggregation>> functions = new ObjectArrayList<>();
        for (SelectQuery.FunctionDef functionDef : selectQuery.getFunctions()) {
            functions.add(getAggregation(functionDef, start, end, interval, symbol(symbols), groupBy, 0));
        }
        if (groupBy != null && !groupBy.isEmpty()) {
            return new GroupByAggregation(record -> new RuntimeJoiningAggregation(functions));
        } else {
            return new RuntimeJoiningAggregation(functions);
        }
    }

    private static String symbol(List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) {
            return null;
        } else if (symbols.size() == 1) {
            return symbols.get(0);
        } else {
            throw new UnsupportedOperationException();
        }
    }

    private Function<GenericRecord, Aggregation> getAggregation(SelectQuery.FunctionDef functionDef, long start, long end, long interval,
                                                                String symbol, List<SelectQuery.TimebaseField> groupBy, int level)
            throws ValidationException {
        Class<? extends Aggregation> clazz = aggregations.get(functionDef.getId(), null);
        if (clazz == null) {
            throw new NoSuchFunctionException(functionDef.getId());
        }
        Constructor<? extends Aggregation> constructor;
        try {
            constructor = clazz.getConstructor(Arguments.class);
        } catch (NoSuchMethodException e) {
            throw new ValidationException(e);
        }

        final Function<GenericRecord, Aggregation> aggregationFunction;

        // actually, if function is in 'aggregations' list on UI (has only on one field arg and is aggregation)
        if (level == 0 && functionDef.getFieldArgs() != null && functionDef.getFieldArgs().size() == 1) {
            SelectQuery.FieldArg arg = functionDef.getFieldArgs().get(0);
            if (arg.getFunction() != null && arg.getFunction().getResultFields() != null
                    && !arg.getFunction().getResultFields().isEmpty()) {
                List<Function<GenericRecord, Aggregation>> aggregations = new ObjectArrayList<>();
                for (Function<GenericRecord, Arguments> arguments : Objects.requireNonNull(extractMultiArguments(
                        arg.getFunction().getResultFields(), functionDef, start, end, interval, symbol, groupBy))) {
                    aggregations.add(record -> {
                        try {
                            return constructor.newInstance(arguments.apply(record));
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    });
                }
                aggregationFunction = record -> new RuntimeJoiningAggregation(aggregations);
            } else {
                Function<GenericRecord, ExtendedArguments> argumentsFunction = extractArguments(functionDef, start, end,
                        interval, symbol, groupBy);
                aggregationFunction = record -> {
                    try {
                        return constructor.newInstance(argumentsFunction.apply(record));
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                };
            }
        } else {
            Function<GenericRecord, ExtendedArguments> argumentsFunction = extractArguments(functionDef, start, end, interval,
                    symbol, groupBy);
            aggregationFunction = record -> {
                try {
                    return constructor.newInstance(argumentsFunction.apply(record));
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            };
        }

        if (functionDef.getFieldArgs() != null && !functionDef.getFieldArgs().isEmpty()) {
            List<SelectQuery.FieldArg> merged = merge(functionDef.getFieldArgs());
            List<Function<GenericRecord, Aggregation>> aggregations = new ObjectArrayList<>();
            for (SelectQuery.FieldArg fieldArg : merged) {
                if (fieldArg.getFunction() != null) {
                    aggregations.add(getAggregation(fieldArg.getFunction(), start, end, interval, symbol, groupBy, level + 1));
                } else {
                    aggregations.add(record -> new PeekFieldAggregation(fieldArg.getField().getName()));
                }
            }
            return record -> new RuntimeJoiningAggregation(aggregations).andThen(aggregationFunction.apply(record));
        }

        return aggregationFunction;
    }

    private static List<SelectQuery.FieldArg> merge(List<SelectQuery.FieldArg> fieldArgs) {
        List<SelectQuery.FieldArg> result = new ArrayList<>();
        Map<String, List<SelectQuery.FunctionDef>> functions = new HashMap<>();
        for (SelectQuery.FieldArg fieldArg : fieldArgs) {
            if (fieldArg.getFunction() != null
                    && (fieldArg.getFunction().getFieldArgs() == null || fieldArg.getFunction().getFieldArgs().isEmpty())
                    && (fieldArg.getFunction().getResultFields() != null && !fieldArg.getFunction().getResultFields().isEmpty())) {
                functions.computeIfAbsent(fieldArg.getFunction().getId(), key -> new ArrayList<>()).add(fieldArg.getFunction());
            } else {
                result.add(fieldArg);
            }
        }
        functions.forEach((id, functionsList) -> {
            SelectQuery.FieldArg fieldArg = new SelectQuery.FieldArg();
            SelectQuery.FunctionDef functionDef = new SelectQuery.FunctionDef();
            fieldArg.setFunction(functionDef);
            functionDef.setId(id);
            functionDef.setConstantArgs(new HashMap<>());
            functionDef.setFieldArgs(Collections.emptyList());
            functionDef.setGroupBy(functionsList.get(0).getGroupBy());
            Map<String, String> resultFields = new HashMap<>();
            for (SelectQuery.FunctionDef def : functionsList) {
                resultFields.putAll(def.getResultFields());
            }
            functionDef.setResultFields(resultFields);
            result.add(fieldArg);
        });
        return result;
    }

    private Function<GenericRecord, ExtendedArguments> extractArguments(SelectQuery.FunctionDef functionDef, long start,
                                                                        long end, long interval, String symbol,
                                                                        List<SelectQuery.TimebaseField> groupBy) throws ValidationException {
        GrafanaFunction grafanaFunction = getFunction(functionDef.getId());
        if (grafanaFunction != null) {
            return extractArguments(grafanaFunction, functionDef, start, end, interval, symbol, groupBy);
        }
        GrafanaAggregation grafanaAggregation = getAggregation(functionDef.getId());
        if (grafanaAggregation != null) {
            return extractArguments(grafanaAggregation, functionDef, start, end, interval, symbol, groupBy);
        }
        throw new NoSuchFunctionException(functionDef.getId());
    }

    private Function<GenericRecord, ExtendedArguments> extractArguments(GrafanaFunction grafanaFunction,
                                                                        SelectQuery.FunctionDef functionDef,
                                                                        long start, long end, long interval, String symbol,
                                                                        List<SelectQuery.TimebaseField> groupBy)
            throws ValidationException {

        ExtendedArguments arguments = new ExtendedArgumentsMap(start, end, interval, symbol, functionDef.getResultField());

        // return fields initialization
        if (grafanaFunction.returnFields().length > 1) {
            for (ReturnField returnField : grafanaFunction.returnFields()) {
                arguments.setString(returnField.constantName(), functionDef.getResultFields().get(returnField.constantName()));
            }
        }

        // constant arguments initialization
        for (ConstantArgument constantArgument : grafanaFunction.constantArguments()) {
            String value = functionDef.getConstantArgs().getOrDefault(constantArgument.name(), constantArgument.defaultValue());
            try {
                arguments.set(constantArgument, value);
            } catch (NumberFormatException exc) {
                throw new ConstantParseException(constantArgument, value);
            }
        }

        // field arguments initialization
        for (int i = 0; i < grafanaFunction.fieldArguments().length; i++) {
            FieldArgument fieldArgument = grafanaFunction.fieldArguments()[i];
            SelectQuery.FieldArg fieldArg = functionDef.getFieldArgs().get(i);
            if (fieldArg.getField() != null) {
                arguments.setString(fieldArgument.name(), fieldArg.getField().getName());
            } else if (fieldArg.getFunction() != null) {
                if (fieldArg.getFunction().getResultFields() != null && !fieldArg.getFunction().getResultFields().isEmpty()) {
                    // suppose, that we do have only one result field selected
                    fieldArg.getFunction().getResultFields().forEach((key, value) -> arguments.setString(fieldArgument.name(), value));
                } else {
                    arguments.setString(fieldArgument.name(), fieldArg.getFunction().getResultField());
                }
            } else {
                throw new ValidationException("Not valid definition of function " + functionDef.getId());
            }
        }

        if (grafanaFunction.symbolRequired()) {
            if (checkSymbol(functionDef.getId(), symbol, groupBy)) {
                return record -> {
                    arguments.setSymbol(record.getValue("symbol").charSequenceValue().toString());
                    return arguments;
                };
            }
        }
        return record -> arguments;
    }

    private Function<GenericRecord, ExtendedArguments> extractArguments(GrafanaAggregation grafanaAggregation,
                                                                        SelectQuery.FunctionDef functionDef,
                                                                        long start, long end, long interval, String symbol,
                                                                        List<SelectQuery.TimebaseField> groupBy)
            throws ValidationException {

        ExtendedArguments arguments = new ExtendedArgumentsMap(start, end, interval, symbol, parseResultName(functionDef.getResultField()));

        // return fields initialization
        if (grafanaAggregation.returnFields().length > 1) {
            for (ReturnField returnField : grafanaAggregation.returnFields()) {
                arguments.setString(returnField.constantName(), functionDef.getResultFields().getOrDefault(returnField.constantName(),
                        returnField.constantName()));
            }
        }

        // constant arguments initialization
        for (ConstantArgument constantArgument : grafanaAggregation.constantArguments()) {
            String value = functionDef.getConstantArgs().getOrDefault(constantArgument.name(), constantArgument.defaultValue());
            try {
                arguments.set(constantArgument, value);
            } catch (NumberFormatException exc) {
                throw new ConstantParseException(constantArgument, value);
            }
        }

        // field arguments initialization
        for (int i = 0; i < grafanaAggregation.fieldArguments().length; i++) {
            FieldArgument fieldArgument = grafanaAggregation.fieldArguments()[i];
            SelectQuery.FieldArg fieldArg = functionDef.getFieldArgs().get(i);
            if (fieldArg.getField() != null) {
                arguments.setString(fieldArgument.name(), fieldArg.getField().getName());
            } else if (fieldArg.getFunction() != null) {
                if (fieldArg.getFunction().getResultFields() != null && !fieldArg.getFunction().getResultFields().isEmpty()) {
                    // suppose, that we do have only one result field selected
                    fieldArg.getFunction().getResultFields().forEach((key, value) -> arguments.setString(fieldArgument.name(), value));
                } else {
                    arguments.setString(fieldArgument.name(), fieldArg.getFunction().getResultField());
                }
            } else {
                throw new ValidationException("Not valid definition of function " + functionDef.getId());
            }
        }

        if (grafanaAggregation.symbolRequired()) {
            if (checkSymbol(functionDef.getId(), symbol, groupBy)) {
                return record -> {
                    arguments.setSymbol(record.getValue("symbol").charSequenceValue().toString());
                    return arguments;
                };
            }
        }
        return record -> arguments;
    }

    private boolean checkSymbol(String functionId, String symbol, List<SelectQuery.TimebaseField> groupBy) throws SymbolNotSetException {
        if (symbol != null) {
            return false;
        }
        if (groupBy != null) {
            for (SelectQuery.TimebaseField timebaseField : groupBy) {
                if (timebaseField.getType().equalsIgnoreCase("InstrumentMessage") &&
                        timebaseField.getName().equalsIgnoreCase("symbol")) {
                    return true;
                }
            }
        }
        throw new SymbolNotSetException(functionId);
    }

    private List<Function<GenericRecord, Arguments>> extractMultiArguments(Map<String, String> resultFields,
                                                                           SelectQuery.FunctionDef functionDef, long start,
                                                                           long end, long interval, String symbol,
                                                                           List<SelectQuery.TimebaseField> groupBy) throws ValidationException {
        GrafanaAggregation grafanaAggregation = getAggregation(functionDef.getId());
        if (grafanaAggregation == null) {
            throw new ValidationException("Suppose to get aggregation, but had " + functionDef.getId());
        }
        List<Function<GenericRecord, Arguments>> result = new ObjectArrayList<>();
        for (String value : resultFields.values()) {
            ExtendedArguments arguments = new ExtendedArgumentsMap(start, end, interval, symbol, value);

            // return fields initialization
            if (grafanaAggregation.returnFields().length > 1) {
                for (ReturnField returnField : grafanaAggregation.returnFields()) {
                    arguments.setString(returnField.constantName(), functionDef.getResultFields().getOrDefault(returnField.constantName(),
                            returnField.constantName()));
                }
            }

            // constant arguments initialization
            for (ConstantArgument constantArgument : grafanaAggregation.constantArguments()) {
                String constantValue = functionDef.getConstantArgs().getOrDefault(constantArgument.name(), constantArgument.defaultValue());
                try {
                    arguments.set(constantArgument, constantValue);
                } catch (NumberFormatException exc) {
                    throw new ConstantParseException(constantArgument, constantValue);
                }
            }

            FieldArgument fieldArgument = grafanaAggregation.fieldArguments()[0];
            SelectQuery.FieldArg fieldArg = functionDef.getFieldArgs().get(0);

            if (fieldArg.getFunction() != null) {
                arguments.setString(fieldArgument.name(), value);
            } else if (fieldArg.getField() != null) {
                arguments.setString(fieldArgument.name(), fieldArg.getField().getName());
            } else {
                throw new ValidationException("Result not set for " + functionDef.getId());
            }

            if (grafanaAggregation.symbolRequired()) {
                if (checkSymbol(functionDef.getId(), symbol, groupBy)) {
                    result.add(record -> {
                        arguments.setSymbol(record.getValue("symbol").charSequenceValue().toString());
                        return arguments;
                    });
                    continue;
                }
            }
            result.add(record -> arguments);
        }
        return result;
    }

    private static String parseResultName(String function) {
        if (function.contains(" as ")) {
            return function.substring(function.indexOf(" as ") + 4);
        } else {
            return function;
        }
    }

    private boolean validateClass(Class<?> clazz) {
        if (!Aggregation.class.isAssignableFrom(clazz)) {
            return false;
        }
        try {
            clazz.getConstructor(Arguments.class);
        } catch (NoSuchMethodException e) {
            LOG.info().append("Class ").append(clazz.getName()).append(" does not contain constructor with one argument of type ")
                    .append(Arguments.class).append(", so it could not be initialized as Aggregation of Function. Consider defining such constructor.")
                    .commit();
            return false;
        }
        return true;
    }

    private Class<? extends Aggregation> getAggregationClass(String id) {
        return aggregations.get(id, null);
    }

    private GrafanaAggregation getAggregation(String id) {
        Class<? extends Aggregation> clazz = getAggregationClass(id);
        if (clazz == null)
            return null;
        return clazz.getAnnotation(GrafanaAggregation.class);
    }

    private GrafanaFunction getFunction(String id) {
        Class<? extends Aggregation> clazz = getAggregationClass(id);
        if (clazz == null)
            return null;
        return clazz.getAnnotation(GrafanaFunction.class);
    }

}
