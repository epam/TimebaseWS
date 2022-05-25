import { IEverChartAnimationState } from '../everChartState';
export declare const setAnimationValue: (state: IEverChartAnimationState, next: number, animate?: boolean) => {
    next: number;
    current: number;
    isRunning: boolean;
    dirty: boolean;
    startAt: number;
    easing: string;
    duration: number;
};
