import { L2MessageSide } from '@deltix/hd.components-order-book';
import { IFormatFunctions, IGridData, IOrderGridState } from './orderGridState';
export declare const formatFunctionsSelector: (state: IOrderGridState) => IFormatFunctions;
export declare const showCumulativeQuantitySelector: (state: IOrderGridState) => boolean;
export declare const gridSideSelector: (side: L2MessageSide) => (state: IOrderGridState) => IGridData;
export declare const viewTypeSelector: (state: IOrderGridState) => boolean;
export declare const viewTypeInverseSelector: (state: IOrderGridState) => boolean;
export declare const abbreviationsSelector: (state: IOrderGridState) => boolean;
