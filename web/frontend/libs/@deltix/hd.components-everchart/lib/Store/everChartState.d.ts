import { IInputState, IViewportState } from '@deltix/hd.components-multi-app';
import { AnyAction } from 'redux';
import { ActionsObservable, Epic, StateObservable } from 'redux-observable';
import { IEverChartPad, IEverChartParams } from './everChartParams';
export interface IEverChartPadState extends IEverChartPad {
    min: IEverChartAnimationState;
    max: IEverChartAnimationState;
    height: number;
    width: number;
}
export interface IEverChartDataItem {
    time: number;
    [key: string]: any;
}
export interface IEverChartAnimationState {
    current: number;
    next: number;
    easing: string;
    duration: number;
    isRunning: boolean;
    startAt: number;
}
export interface IEverChartCrosshair {
    time: number;
    pad: string;
    value: number;
}
/**
 * block: [from min, to max]
 */
export interface IEverChartDataBlock<T extends IEverChartDataItem = IEverChartDataItem> {
    data: T[];
    interval: number;
    from: number;
    to: number;
}
export interface IEverChartAppState {
    appId: string;
    params: Omit<IEverChartParams, 'pads'>;
    pads: Record<string, IEverChartPadState>;
    data: IEverChartDataBlock[];
    /** position from right */
    /** x scale */
    zoom: IEverChartAnimationState;
    lastRequestedTime: number;
    crosshair?: IEverChartCrosshair;
    tick?: number;
    lastTime: number;
    lastTimeStub: IEverChartAnimationState;
    /** time */
    scrollPosition: number;
    disableMagnet: boolean;
    animationDuration: number;
    disableBackButton: boolean;
}
export interface IEverChartState {
    app: IEverChartAppState;
    input: IInputState;
    viewport: IViewportState;
}
export declare type EverChartEpic = Epic<AnyAction, AnyAction, IEverChartState>;
export declare type EverChartActionStream = ActionsObservable<AnyAction>;
export declare type EverChartStateStream = StateObservable<IEverChartState>;
