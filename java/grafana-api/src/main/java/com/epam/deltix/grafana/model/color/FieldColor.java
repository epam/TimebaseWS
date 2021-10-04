package com.epam.deltix.grafana.model.color;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class FieldColor {
    @Nonnull
    protected FieldColorMode mode;

    @Nullable
    protected ColorScheme schemeName;

    @Nullable
    protected String fixedColor;

    public FieldColor(@Nonnull FieldColorMode mode, @Nullable ColorScheme schemeName, @Nullable String fixedColor) {
        this.mode = mode;
        this.schemeName = schemeName;
        this.fixedColor = fixedColor;
    }

    @Nonnull
    public FieldColorMode getMode() {
        return mode;
    }

    public void setMode(@Nonnull FieldColorMode mode) {
        this.mode = mode;
    }

    @Nullable
    public ColorScheme getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(@Nullable ColorScheme schemeName) {
        this.schemeName = schemeName;
    }

    @Nullable
    public String getFixedColor() {
        return fixedColor;
    }

    public void setFixedColor(@Nullable String fixedColor) {
        this.fixedColor = fixedColor;
    }
}
