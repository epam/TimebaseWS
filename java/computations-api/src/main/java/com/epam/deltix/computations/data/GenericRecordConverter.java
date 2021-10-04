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
package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.complex.ListValueInfo;
import com.epam.deltix.computations.data.base.complex.ObjectValueInfo;
import com.epam.deltix.computations.data.base.numeric.BooleanValueInfo;
import com.epam.deltix.containers.generated.CharSequenceToObjHashMap;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.util.collections.generated.*;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.qsrv.hf.codec.ArrayTypeUtil;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GenericRecordConverter {

    private final Map<Class<?>, List<Field>> classes = new HashMap<>();
    private final Map<Class<?>, CharSequenceToObjHashMap<Object>> enums = new HashMap<>();
    private final ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

    public void convert(GenericRecord from, Object to) throws IllegalAccessException {
        if (to == null) {
            throw new NullPointerException();
        }
        for (Field field : getFields(to.getClass())) {
            if (field.getName().equals("timestamp")) {
                field.setLong(to, from.timestamp());
                continue;
            }
            processField(field, from, to);
        }
    }

    private <T> void processField(Field field, GenericValueInfo from, T to) {
        try {
            Class<?> type = field.getType();
            if (type == byte.class) {
                field.setByte(to, from.getValue(field.getName()).byteValue());
            } else if (type == short.class) {
                field.set(to, from.getValue(field.getName()).shortValue());
            } else if (type == int.class) {
                field.setInt(to, from.getValue(field.getName()).intValue());
            } else if (type == long.class) {
                if (field.getAnnotation(Decimal.class) != null) {
                    field.setLong(to, from.getValue(field.getName()).decimalValue());
                } else {
                    try {
                        field.setLong(to, from.getValue(field.getName()).longValue());
                    } catch (UnsupportedOperationException exc) {
                        field.setLong(to, from.getValue(field.getName()).decimalValue());
                    }
                }
            } else if (type == double.class) {
                field.setDouble(to, from.getValue(field.getName()).doubleValue());
            } else if (type == float.class) {
                field.setFloat(to, from.getValue(field.getName()).floatValue());
            } else if (type == boolean.class) {
                field.setBoolean(to, from.getValue(field.getName()).byteValue() == 1);
            } else if (type == char.class) {
                field.setChar(to, from.getValue(field.getName()).charValue());
            } else if (type == CharSequence.class) {
                CharSequence charSequence = (CharSequence) field.get(to);
                if (!(charSequence instanceof StringBuilder)) {
                    charSequence = new StringBuilder();
                    field.set(to, charSequence);
                }
                StringBuilder sb = (StringBuilder) charSequence;
                sb.append(from.getValue(field.getName()).charSequenceValue());
            } else if (field.getType().isEnum()) {
                field.set(to, getEnumValue(field.getType(), from.getValue(field.getName()).charSequenceValue()));
            } else if (List.class.isAssignableFrom(field.getType())) {
                GenericValueInfo fromValue = from.getValue(field.getName());
                if (fromValue.isNull()) {
                    field.set(to, null);
                    return;
                }
                ListValueInfo listValue = (ListValueInfo) fromValue;
                Class<?> underlineType = ArrayTypeUtil.getUnderline(field.getType());
                if (underlineType == byte.class) {
                    // ToDo
                } else if (underlineType == boolean.class) {
                    BooleanArrayList list = (BooleanArrayList) field.get(to);
                    if (list == null) {
                        list = new BooleanArrayList();
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(BooleanValueInfo.isTrue((BooleanValueInfo) value));
                    }
                } else if (underlineType == char.class) {
                    CharacterArrayList list = (CharacterArrayList) field.get(to);
                    if (list == null) {
                        list = new CharacterArrayList(from.size());
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(value.charValue());
                    }
                } else if (underlineType == short.class) {
                    ShortArrayList list = (ShortArrayList) field.get(to);
                    if (list == null) {
                        list = new ShortArrayList(from.size());
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(value.shortValue());
                    }
                } else if (underlineType == int.class) {
                    IntegerArrayList list = (IntegerArrayList) field.get(to);
                    if (list == null) {
                        list = new IntegerArrayList(from.size());
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(value.intValue());
                    }
                } else if (underlineType == long.class) {
                    LongArrayList list = (LongArrayList) field.get(to);
                    if (list == null) {
                        list = new LongArrayList(from.size());
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(value.longValue());
                    }
                } else if (underlineType == float.class) {
                    FloatArrayList list = (FloatArrayList) field.get(to);
                    if (list == null) {
                        list = new FloatArrayList(from.size());
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(value.floatValue());
                    }
                } else if (underlineType == double.class) {
                    DoubleArrayList list = (DoubleArrayList) field.get(to);
                    if (list == null) {
                        list = new DoubleArrayList(from.size());
                        field.set(to, list);
                    }
                    for (GenericValueInfo value : listValue) {
                        list.add(value.doubleValue());
                    }
                } else if (underlineType == Object.class) {
                    ObjectArrayList list = (ObjectArrayList) field.get(to);
                    if (list == null) {
                        list = (ObjectArrayList) field.getType().newInstance();
                        field.set(to, list);
                    }
                    list.clear();

                    for (int i = 0; i < listValue.size(); i++) {
                        ObjectValueInfo objectValue = (ObjectValueInfo) listValue.get(i);
                        if (objectValue != null && !objectValue.isNull()) {
                            String objectType = objectValue.getType().charSequenceValue().toString();
                            Class<?> clazz = classLoader.loadClass(objectType);
                            Object object = clazz.getConstructor().newInstance();
                            list.add(object);
                            for (Field field1 : getFields(clazz)) {
                                processField(field1, objectValue, object);
                            }
                        } else {
                            field.set(to, null);
                        }
                    }

                } else {
                    throw new UnsupportedOperationException();
                }
            } else {
                GenericValueInfo valueInfo = from.getValue(field.getName());
                if (valueInfo != null && valueInfo.isNotNull()) {
                    ObjectValueInfo objectValue = (ObjectValueInfo) valueInfo;
                    String objectType = objectValue.getType().charSequenceValue().toString();
                    Class<?> clazz = classLoader.loadClass(objectType);
                    Object value = field.get(to);
                    if (value == null || value.getClass() != clazz) {
                        value = clazz.getConstructor().newInstance();
                        field.set(to, value);
                    }
                    for (Field field1 : getFields(clazz)) {
                        processField(field1, objectValue, value);
                    }
                } else {
                    field.set(to, null);
                }
            }
        } catch (InstantiationException | InvocationTargetException | NoSuchMethodException | IllegalAccessException | ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    private List<Field> getFields(Class<?> clazz) {
        return classes.computeIfAbsent(clazz, cl -> {
            List<Field> fields = new ObjectArrayList<>();
            computeFields(fields, cl);
            return fields;
        });
    }

    private void computeFields(List<Field> fields, Class<?> clazz) {
        if (clazz == null || clazz.equals(InstrumentMessage.class))
            return;
        Arrays.stream(clazz.getDeclaredFields())
                .filter(field -> !Modifier.isStatic(field.getModifiers()))
                .peek(field -> field.setAccessible(true))
                .forEach(fields::add);
        computeFields(fields, clazz.getSuperclass());
    }

    private Object getEnumValue(Class<?> clazz, CharSequence s) {
        if (s == null) {
            return null;
        }
        CharSequenceToObjHashMap<Object> map = enums.computeIfAbsent(clazz, cl -> {
            CharSequenceToObjHashMap<Object> result = new CharSequenceToObjHashMap<>(null);
            for (Object enumConstant : cl.getEnumConstants()) {
                result.set(((Enum<?>) enumConstant).name(), enumConstant);
            }
            return result;
        });
        return map.get(s);
    }

//    public static void main(String[] args) throws IllegalAccessException {
//        L2EntryUpdate l2EntryUpdate = new L2EntryUpdate();
//        l2EntryUpdate.setAction(BookUpdateAction.DELETE);
//        l2EntryUpdate.setLevel((short) 1);
//        l2EntryUpdate.setSide(QuoteSide.BID);
//        l2EntryUpdate.setExchangeId(AlphanumericCodec.encode("HEJ"));
//        l2EntryUpdate.setPrice(Decimal64Utils.fromDouble(34.5667));
//        l2EntryUpdate.setSize(Decimal64Utils.fromDouble(366346.34));
//        l2EntryUpdate.setNumberOfOrders(327);
//
//        MutableGenericRecord record = new MutableGenericRecordImpl();
//        record.set("action", MutableCharSequenceValue.of("DELETE"));
//        record.set("level", MutableShortValue.of((short) 1));
//        record.set("side", MutableCharSequenceValue.of("BID"));
//        record.set("exchangeId", MutableAlphanumericValue.of("HEJ"));
//        record.set("price", MutableDecimalValue.of(Decimal64Utils.fromDouble(534.3466)));
//        record.set("size", MutableDecimalValue.of(Decimal64Utils.fromDouble(37787.388)));
//        record.set("numberOfOrders", MutableLongValue.of(2992));
//        record.set("contractId", new MutableAlphanumericValue());
//        record.set("isImplied", new MutableBooleanValue());
//        record.set("participantId", new MutableCharSequenceValue());
//        record.set("quoteId", new MutableCharSequenceValue());
//
//        GenericRecordConverter converter = new GenericRecordConverter();
//        converter.convert(record, l2EntryUpdate);
//        System.out.println(l2EntryUpdate);
//    }

}
