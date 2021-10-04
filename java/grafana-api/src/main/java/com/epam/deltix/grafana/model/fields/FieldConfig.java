package com.epam.deltix.grafana.model.fields;


import com.epam.deltix.grafana.model.color.FieldColor;
import com.epam.deltix.grafana.model.mappings.ValueMapping;
import com.epam.deltix.grafana.model.thresholds.ThresholdsConfig;

import javax.annotation.Nullable;
import java.util.List;

public class FieldConfig {

    @Nullable
    protected String displayName;

    @Nullable
    protected Boolean filterable;

    @Nullable
    protected String unit;

    @Nullable
    protected Double decimals;

    @Nullable
    protected Double min;

    @Nullable
    protected Double max;

    @Nullable
    protected List<ValueMapping> mappings;

    @Nullable
    protected List<ThresholdsConfig> thresholdsConfigs;

    @Nullable
    protected FieldColor color;

    @Nullable
    protected NullValueMode nullValueMode;

    @Nullable
    protected String noValue;

    @Nullable
    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(@Nullable String displayName) {
        this.displayName = displayName;
    }

    @Nullable
    public Boolean getFilterable() {
        return filterable;
    }

    public void setFilterable(@Nullable Boolean filterable) {
        this.filterable = filterable;
    }

    @Nullable
    public String getUnit() {
        return unit;
    }

    public void setUnit(@Nullable String unit) {
        this.unit = unit;
    }

    @Nullable
    public Double getDecimals() {
        return decimals;
    }

    public void setDecimals(@Nullable Double decimals) {
        this.decimals = decimals;
    }

    @Nullable
    public Double getMin() {
        return min;
    }

    public void setMin(@Nullable Double min) {
        this.min = min;
    }

    @Nullable
    public Double getMax() {
        return max;
    }

    public void setMax(@Nullable Double max) {
        this.max = max;
    }

    @Nullable
    public List<ValueMapping> getMappings() {
        return mappings;
    }

    public void setMappings(@Nullable List<ValueMapping> mappings) {
        this.mappings = mappings;
    }

    @Nullable
    public List<ThresholdsConfig> getThresholdsConfigs() {
        return thresholdsConfigs;
    }

    public void setThresholdsConfigs(@Nullable List<ThresholdsConfig> thresholdsConfigs) {
        this.thresholdsConfigs = thresholdsConfigs;
    }

    @Nullable
    public FieldColor getColor() {
        return color;
    }

    public void setColor(@Nullable FieldColor color) {
        this.color = color;
    }

    @Nullable
    public NullValueMode getNullValueMode() {
        return nullValueMode;
    }

    public void setNullValueMode(@Nullable NullValueMode nullValueMode) {
        this.nullValueMode = nullValueMode;
    }

    @Nullable
    public String getNoValue() {
        return noValue;
    }

    public void setNoValue(@Nullable String noValue) {
        this.noValue = noValue;
    }
}
