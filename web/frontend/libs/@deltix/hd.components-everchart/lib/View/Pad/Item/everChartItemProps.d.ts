import { IEverChartBaseItem } from '../../../Store/everChartParams';
import { IEverChartPadState } from '../../../Store/everChartState';
export interface IEverChartItemProps<T extends IEverChartBaseItem = IEverChartBaseItem> {
    pad: IEverChartPadState;
    item: T;
    itemWidth?: number;
    x: number;
    y: number;
}
