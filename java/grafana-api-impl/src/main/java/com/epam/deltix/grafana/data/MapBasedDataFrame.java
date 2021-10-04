package com.epam.deltix.grafana.data;

import com.epam.deltix.grafana.model.fields.Column;
import com.epam.deltix.grafana.model.fields.ColumnImpl;
import com.epam.deltix.grafana.model.fields.Field;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.grafana.model.DataFrame;
import com.epam.deltix.grafana.model.fields.FieldType;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.*;

public class MapBasedDataFrame implements DataFrame {

    @JsonIgnore
    private final String name;

    @JsonIgnore
    private final Map<Field, List<Object>> columns = new HashMap<>();

    @JsonIgnore
    private int length = 0;

    public MapBasedDataFrame(String name, List<Field> columns) {
        this(name, columns, true);
    }

    public MapBasedDataFrame(String name, List<Field> columns, boolean createTimestamp) {
        this.name = name;
        columns.forEach(c -> this.columns.put(c, new ObjectArrayList<>()));
        if (createTimestamp) {
            this.columns.put(new ColumnImpl("timestamp", FieldType.TIME), new ObjectArrayList<>());
        }
    }

    @Nullable
    @Override
    public String getName() {
        return null;
    }

    @Nonnull
    @Override
    public Collection<Column> getFields() {
        List<Column> result = new ArrayList<>();
        columns.entrySet().stream().sorted(Comparator.comparing(e -> e.getKey().name()))
                .forEach(entry -> result.add(new ColumnImpl(entry.getKey().name(), entry.getKey().type(), entry.getKey().config(), entry.getValue())));
        return result;
    }

    @Override
    public int getLength() {
        return length;
    }

    public void append(Map<String, Object> row) {
        length++;
        columns.forEach((k, v) -> v.add(row.get(k.name())));
    }

    public void append(List<TreeMap<Long, List<Map<String, Object>>>> maps) {
        NavigableSet<Long> timestamps = maps.stream().map(TreeMap::navigableKeySet).reduce((set1, set2) -> {
            TreeSet<Long> treeSet = new TreeSet<>(set1);
            treeSet.addAll(set2);
            return treeSet;
        }).orElseGet(TreeSet::new);
        List<Map<String, Object>> resultList = new ObjectArrayList<>();
        for (Long timestamp : timestamps) {
            resultList.clear();
            for (TreeMap<Long, List<Map<String, Object>>> map : maps) {
                List<Map<String, Object>> list = map.get(timestamp);
                if (list != null && !list.isEmpty()) {
                    for (int i = 0; i < list.size(); i++) {
                        Map<String, Object> result;
                        if (resultList.size() > i) {
                            result = resultList.get(i);
                        } else {
                            result = new HashMap<>();
                            resultList.add(result);
                            result.put("timestamp", timestamp);
                        }
                        result.putAll(list.get(i));
                    }
                }
            }
            resultList.forEach(this::append);
        }
    }
}
