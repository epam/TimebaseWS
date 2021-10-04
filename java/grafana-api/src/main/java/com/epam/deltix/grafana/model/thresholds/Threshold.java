package com.epam.deltix.grafana.model.thresholds;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class Threshold {

    protected double number;

    @Nonnull
    protected String color;

    @Nullable
    protected State state;

    public Threshold(double number, @Nonnull String color, @Nullable State state) {
        this.number = number;
        this.color = color;
        this.state = state;
    }

    public double getNumber() {
        return number;
    }

    public void setNumber(double number) {
        this.number = number;
    }

    @Nonnull
    public String getColor() {
        return color;
    }

    public void setColor(@Nonnull String color) {
        this.color = color;
    }

    @Nullable
    public State getState() {
        return state;
    }

    public void setState(@Nullable State state) {
        this.state = state;
    }
}
