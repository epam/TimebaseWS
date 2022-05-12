import { Graphics, StageContext, Text } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
import { Color, IEverChartIntervalItem, IEverChartLabelItem, IEverChartLineItem, IEverChartPadItem, IEverChartRangeAreaItem, IEverChartShapeItem, IEverChartShapeWithLabelItem, IEverChartVolumeItem } from '../../../Store/everChartParams';
import { IEverChartPadState, IEverChartState } from '../../../Store/everChartState';
import { IShape } from '../../../Store/Selectors/everChartShapesSelectors';
export declare class EverChartItemStage extends Graphics<IEverChartState> {
    protected pad: IEverChartPadState;
    protected item: IEverChartPadItem;
    protected colorCache: Map<Color, {
        alpha: number;
        color: number;
    }>;
    protected buffer: Text[];
    private _symbolWidth;
    protected get symbolWidth(): number;
    setState(state: IEverChartState, context: StageContext, dispatch: (action: AnyAction) => void): void;
    destroy(): void;
    setPad(pad: IEverChartPadState, item: IEverChartPadItem): void;
    protected getColor(color: Color): {
        alpha: number;
        color: number;
    };
    protected drawLine(state: IEverChartState, item: IEverChartLineItem): void;
    protected drawRangeArea(state: IEverChartState, item: IEverChartRangeAreaItem): void;
    protected drawRangeInterval(state: IEverChartState, item: IEverChartIntervalItem): void;
    protected drawRangeVolumes(state: IEverChartState, item: IEverChartVolumeItem): void;
    protected drawShapes(state: IEverChartState, item: IEverChartShapeItem): void;
    protected drawShapesList(shapes: IShape[]): void;
    protected drawLabels(state: IEverChartState, item: IEverChartLabelItem, context: StageContext): void;
    protected drawShapesAndLabels(state: IEverChartState, item: IEverChartShapeWithLabelItem, context: StageContext): void;
}
