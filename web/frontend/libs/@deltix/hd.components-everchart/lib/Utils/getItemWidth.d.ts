import { IEverChartBaseItem } from '../Store/everChartParams';
import { IEverChartPadState } from '../Store/everChartState';
export declare const getItemWidthForItem: (item: IEverChartBaseItem) => 1 | 0;
export declare const getPadItemWidth: (pad: IEverChartPadState) => number;
export declare const getItemWidth: (pads: Record<string, IEverChartPadState>) => number;
