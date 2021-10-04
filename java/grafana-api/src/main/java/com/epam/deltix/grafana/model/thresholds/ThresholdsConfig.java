package com.epam.deltix.grafana.model.thresholds;

import javax.annotation.Nonnull;
import java.util.List;

public class ThresholdsConfig {

    @Nonnull
    protected ThresholdsMode mode;

    @Nonnull
    protected List<Threshold> steps;

    public ThresholdsConfig(@Nonnull ThresholdsMode mode, @Nonnull List<Threshold> steps) {
        this.mode = mode;
        this.steps = steps;
    }

    @Nonnull
    public ThresholdsMode getMode() {
        return mode;
    }

    public void setMode(@Nonnull ThresholdsMode mode) {
        this.mode = mode;
    }

    @Nonnull
    public List<Threshold> getSteps() {
        return steps;
    }

    public void setSteps(@Nonnull List<Threshold> steps) {
        this.steps = steps;
    }
}
