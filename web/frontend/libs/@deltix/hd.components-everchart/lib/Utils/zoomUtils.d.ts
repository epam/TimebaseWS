export declare const ZOOM: {
    zoom: number[];
    intervals: number[];
};
/**
 * 0 - 1 1ms
 * 1500 - 100 100 ms
 * 2500 - 1000 1s
 * 3900 - 30000 30s
 * 4200 - 60000 1m
 * 5700 - 1800000 30m
 * 6100 - 3600000 1h
 * 6600 - 14400000 4h
 * 7000 - 28800000 8h
 * 7500 - 86400000 1d
 * 8100 - 604800000 1w
 */
export declare const fromZoom: (value: number) => number;
export declare const toZoom: (value: number) => number;
export declare const getClosestIntervalValue: (value: number) => number;
export declare const zoomToInterval: (zoom: number) => number;
export declare const bringingZoomToInterval: (zoom: number) => number;
export declare const intervalToZoom: (interval: number) => number;
