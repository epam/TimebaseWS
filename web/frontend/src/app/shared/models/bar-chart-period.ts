export interface BarChartPeriod {
  aggregation: number;
  name: string;
}

export const maxBarSize = 1000 * 365 * 24 * 60 * 60 * 1000;
