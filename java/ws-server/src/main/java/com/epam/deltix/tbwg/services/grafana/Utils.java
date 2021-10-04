package com.epam.deltix.tbwg.services.grafana;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.util.collections.generated.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Utils {

    private static final Log LOG = LogFactory.getLog(Utils.class);
    private static final Map<Class<?>, Class<? extends List<? extends Number>>> map = new HashMap<>();

    static {
        map.put(byte.class, ByteArrayList.class);
        map.put(Byte.class, ByteArrayList.class);
        map.put(short.class, ShortArrayList.class);
        map.put(Short.class, ShortArrayList.class);
        map.put(int.class, IntegerArrayList.class);
        map.put(Integer.class, IntegerArrayList.class);
        map.put(long.class, LongArrayList.class);
        map.put(Long.class, LongArrayList.class);

        map.put(float.class, FloatArrayList.class);
        map.put(Float.class, FloatArrayList.class);
        map.put(double.class, DoubleArrayList.class);
        map.put(Double.class, DoubleArrayList.class);
    }

    static List<Number> listFor(Class<?> clazz) {
        if (map.containsKey(clazz)) {
            try {
                map.get(clazz).getConstructor().newInstance();
            } catch (Exception e) {
                LOG.error().append(e).commit();
            }
        }
        return null;
    }
}
