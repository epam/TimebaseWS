package com.epam.deltix.grafana.test;

/**
 */
public enum GrafanaTestEnum {
  /**
   */
  FIRST(0),

  /**
   */
  SECOND(1),

  /**
   */
  THIRD(2),

  /**
   */
  FOURTH(3);

  private final int value;

  GrafanaTestEnum(int value) {
    this.value = value;
  }

  public int getNumber() {
    return this.value;
  }

  public static GrafanaTestEnum valueOf(int number) {
    switch (number) {
      case 0: return FIRST;
      case 1: return SECOND;
      case 2: return THIRD;
      case 3: return FOURTH;
      default: return null;
    }
  }

  public static GrafanaTestEnum strictValueOf(int number) {
    final GrafanaTestEnum value = valueOf(number);
    if (value == null) {
      throw new IllegalArgumentException("Enumeration 'GrafanaTestEnum' does not have value corresponding to '" + number + "'.");
    }
    return value;
  }
}
