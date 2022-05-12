import { IEverChartPad } from '../everChartParams';
import { IEverChartCrosshair, IEverChartDataItem } from '../everChartState';
export declare const everChartNewConfigurationAction: (pads: IEverChartPad[]) => {
    type: string;
    payload: {
        pads: IEverChartPad[];
    };
};
export declare const everChartChangeConfigurationAction: (pads: IEverChartPad[]) => {
    type: string;
    payload: {
        pads: IEverChartPad[];
    };
};
export declare const everChartChangeViewportAction: (viewport: Record<string, {
    width: number;
    height: number;
}>) => {
    type: string;
    payload: {
        viewport: Record<string, {
            width: number;
            height: number;
        }>;
    };
};
export declare const everChartDataAction: (data: IEverChartDataItem[], interval: number) => {
    type: string;
    payload: {
        data: IEverChartDataItem[];
        interval: number;
    };
};
export declare const everChartExtremumAction: (extremums: Record<string, {
    min: number;
    max: number;
}>) => {
    type: string;
    payload: {
        extremums: Record<string, {
            min: number;
            max: number;
        }>;
    };
};
export declare const everChartRequestHistoryAction: (lastVisibleTime: number, end?: number) => {
    type: string;
    payload: {
        lastVisibleTime: number;
        end: number;
    };
};
export declare const everChartHistoryDataAction: (data: IEverChartDataItem[], time: number, interval: number, end?: number) => {
    type: string;
    payload: {
        data: IEverChartDataItem[];
        time: number;
        interval: number;
        end: number;
    };
};
export declare const everChartCrosshairAction: (crosshair: IEverChartCrosshair, x: number, y: number, data?: IEverChartDataItem) => {
    type: string;
    payload: {
        crosshair: IEverChartCrosshair;
        x: number;
        y: number;
        data: IEverChartDataItem;
    };
};
export declare const everChartPointerOverAction: (pad: string) => {
    type: string;
    payload: {
        pad: string;
    };
};
export declare const everChartPointerOutAction: (pad: string) => {
    type: string;
    payload: {
        pad: string;
    };
};
export declare const everChartPointerMoveAction: (pad: string, x: number, y: number) => {
    type: string;
    payload: {
        pad: string;
        x: number;
        y: number;
    };
};
export declare const everChartTickAction: (tick: number) => {
    type: string;
    payload: {
        tick: number;
    };
};
export declare const everChartNewIntervalAction: (interval: number, lastVisibleTime: number) => {
    type: string;
    payload: {
        interval: number;
        lastVisibleTime: number;
    };
};
export declare const everChartZoomAction: (zoom: number) => {
    type: string;
    payload: {
        zoom: number;
    };
};
/**
 *
 * @param scroll time from right side
 * @param animate
 * @returns
 */
export declare const everChartScrollToTimeAction: (scroll: number) => {
    type: string;
    payload: {
        scroll: number;
    };
};
export declare const everChartLastTimeStubAction: (lastTimeStub: number, animate?: boolean) => {
    type: string;
    payload: {
        lastTimeStub: number;
        animate: boolean;
    };
};
export declare const everChartLastTimeAction: (lastTime: number) => {
    type: string;
    payload: {
        lastTime: number;
    };
};
export declare const everChartChangeWindowTimeBorders: (startTime: number, endTime: number) => {
    type: string;
    payload: {
        startTime: number;
        endTime: number;
    };
};
