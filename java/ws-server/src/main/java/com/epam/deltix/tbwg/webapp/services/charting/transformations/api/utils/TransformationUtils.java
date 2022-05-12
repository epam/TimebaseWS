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
package com.epam.deltix.tbwg.webapp.services.charting.transformations.api.utils;

import com.epam.deltix.dfp.Decimal64;
import com.epam.deltix.tbwg.webapp.services.charting.transformations.api.transformations.api.Transformation;
import io.reactivex.Observable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TransformationUtils {
    private static final Logger logger = LoggerFactory.getLogger(TransformationUtils.class);

    public static void validateClasses(final List<? extends Class<?>> input, final List<? extends Class<?>> output) {
        for (final Class<?> clazz : input) {
            if (output.stream().noneMatch(x -> x.isAssignableFrom(clazz))) {
                throw new IllegalArgumentException(String.format(
                        "Input class %s is not found in output classes: %s",
                        clazz.getName(),
                        output.stream().map(Class::getName).collect(Collectors.toList())
                ));
            }
        }
    }

    public static List<? extends Class<?>> validateTransformations(final List<Transformation> transformations,
                                                                   final List<? extends Class<?>> inputClasses) {
        List<? extends Class<?>> prevClasses = inputClasses;
        for (final Transformation<?, ?> transformation : transformations) {
            logger.info("Validate transformation {}", transformation.getClass().getName());
            validateClasses(prevClasses, transformation.getInputClasses());
            prevClasses = transformation.getOutputClasses();
        }
        return prevClasses;
    }

    public static Class<Transformation> resolveTransformationClass(final String name) throws ClassNotFoundException {
        final Class clazz = Class.forName(name);
        if (!Transformation.class.isAssignableFrom(clazz)) {
            throw new IllegalStateException(String.format("Class `%s` is not transformation", name));
        }
        return (Class<Transformation>) clazz;
    }

    public static List<Class<? extends Transformation>> resolveTransformationClasses(final List<String> classNames) {
        return classNames.stream()
                .map(x -> {
                    try {
                        return resolveTransformationClass(x);
                    } catch (ClassNotFoundException e) {
                        throw new IllegalStateException(e);
                    }
                })
                .collect(Collectors.toList());
    }

    public static Transformation createTransformation(final Class<? extends Transformation> transformationClass,
                                                      final Function3<String, Class, CheckedConsumer<Object>, Void> paramResolver) throws IllegalAccessException, InstantiationException, InvocationTargetException {
        final Transformation transformation = transformationClass.newInstance();
        applyParams(transformation, paramResolver);
        return transformation;
    }

    public static List<Transformation> createTransformations(final List<Class<? extends Transformation>> transformationClasses,
                                                             final Function3<String, Class, CheckedConsumer<Object>, Void> paramResolver) throws IllegalAccessException, InstantiationException, InvocationTargetException {
        final List<Transformation> transformations = new ArrayList<>(transformationClasses.size());
        for (final Class<? extends Transformation> transformationClass : transformationClasses) {
            transformations.add(createTransformation(transformationClass, paramResolver));
        }
        return transformations;
    }

    private static void applyParams(final Transformation transformation, final Function3<String, Class, CheckedConsumer<Object>, Void> paramResolver) throws InvocationTargetException, IllegalAccessException {
//        Method postConstruct = null;
        for (final Method method : transformation.getClass().getMethods()) {
            final String methodName = method.getName();
            if (methodName.startsWith("set") && method.getParameterCount() == 1) {
                paramResolver.apply(methodName.substring(3).toLowerCase(), method.getParameterTypes()[0], o -> method.invoke(transformation, o));
            }
//            else if (methodName.equals("postConstruct"))
//                postConstruct = method;
        }
//        if (postConstruct != null)
//            postConstruct.invoke(transformation);
    }

    public static Observable<?> applyTransformations(final Observable<?> observable, final List<Transformation> transformations) {
        Observable<?> resultObservable = observable;
        for (Transformation transformation : transformations) {
            resultObservable = resultObservable.lift(transformation);
        }
        return resultObservable;
    }

    public static long applyOffset(final List<Transformation> transformations, final long time) {
        logger.debug("Apply offset started from timestamp {}", time);
        long result = time;
        for (int i = transformations.size() - 1; i >= 0; i--) {
            result = transformations.get(i).applyOffset(result);
            logger.trace("Transformation {} offset to {}", transformations.get(i).getClass().getName(), result);
        }
        return result;
    }

    public static long applyTimestamp(final List<Transformation> transformations, final long time) {
        logger.debug("Apply timestamp started from timestamp {}", time);
        long result = time;
        for (int i = 0; i < transformations.size(); i++) {
            result = transformations.get(i).applyTimestamp(result);
            logger.trace("Transformation {} end timestamp {}", transformations.get(i).getClass().getName(), result);
        }
        return result;
    }

    public static Object resolveSimpleParameter(final String param, final Class type) {
        if (Long.class.isAssignableFrom(type) || long.class.isAssignableFrom(type)) {
            return Long.parseLong(param);
        } else if (Integer.class.isAssignableFrom(type) || int.class.isAssignableFrom(type)) {
            return Integer.parseInt(param);
        } else if (Short.class.isAssignableFrom(type) || short.class.isAssignableFrom(type)) {
            return Short.parseShort(param);
        } else if (Byte.class.isAssignableFrom(type) || byte.class.isAssignableFrom(type)) {
            return Byte.parseByte(param);
        } else if (Boolean.class.isAssignableFrom(type) || boolean.class.isAssignableFrom(type)) {
            return Boolean.parseBoolean(param);
        } else if (String.class.isAssignableFrom(type)) {
            return param;
        } else if (Decimal64.class.isAssignableFrom(type)) {
            return Decimal64.parse(param);
        } else {
            throw new UnsupportedOperationException(String.format("Type %s is not supported", type));
        }
    }
}
