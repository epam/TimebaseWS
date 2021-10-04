package com.epam.deltix.grafana.data;

import com.epam.deltix.grafana.model.fields.Column;
import com.epam.deltix.grafana.model.DataFrame;

public interface MutableDataFrame extends DataFrame {

    /**
     * Adds column to dataframe. Missing values will be filled with nones.
     * @param column new column
     */
    void addColumn(Column column);

    boolean hasColumn(String column);

    /**
     * Appends row to dataframe. Values must be defined in fields order.
     * Size of array must be equal to number of fields.
     * @param values row to append
     */
    void append(Object[] values);

    /**
     * Inserts row in dataframe on provided index.
     * @param index insert position
     * @param values row to insert
     */
    void insert(int index, Object[] values);

    /**
     * Removes row from dataframe on index.
     * @param index position of row to remove
     */
    void remove(int index);

}
