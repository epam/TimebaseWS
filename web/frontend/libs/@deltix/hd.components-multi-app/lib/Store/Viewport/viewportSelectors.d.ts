import { IViewportState } from "./viewportState";
export declare const viewportSelector: (state: {
    viewport: IViewportState;
}) => IViewportState;
export declare const widthSelector: (state: {
    viewport: IViewportState;
}) => number;
export declare const heightSelector: (state: {
    viewport: IViewportState;
}) => number;
