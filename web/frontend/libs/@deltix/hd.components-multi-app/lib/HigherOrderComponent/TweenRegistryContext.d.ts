import * as React from 'react';
import { TweenRegistry } from '../TimeLine/TimeLineRegistry';
import { Tween } from '../TimeLine/Tween';
export declare const TweenRegistryContext: React.Context<TweenRegistry>;
export interface IWithTween {
    createTween(): Tween;
}
export declare const WithTween: () => (BaseComponent: any) => any;
export declare function useTween(callback: (tween: Tween) => any): Tween;
