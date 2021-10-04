export interface ChartModel {
  effectiveWindow: {
    end: string;
    start: string;
  };
  lines: {[key: string]: ChartRawLine};
  name: string;
}

export interface ChartRawLine {
  aggregationSizeMs: number;
  newWindowSizeMs: number;
  points: {
    time: number;
    value: string;
    high?: string;
    low?: string;
    close?: string;
    open?: string;
    askPrice?: string;
    bidPrice?: string;
  }[];
}

export type ChartData = [
  {
    end: string;
    start: string;
  },
  any[],
  number,
];

export enum ChartTypes {
  BARS = 'BARS',
  TRADES_BBO = 'TRADES_BBO',
}
