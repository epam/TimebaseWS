/// <reference types="react" />
import * as PIXI from "pixi.js";
export interface ICircleProps {
    color: number;
    x: number;
    y: number;
    radius: number;
    alpha: number;
}
export declare const Circle: import("react").FC<ICircleProps & {
    ref?: import("react").Ref<PIXI.Graphics>;
}>;
