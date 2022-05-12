import { updateViewportAction } from "../viewportActions";
import { IViewportState } from "../viewportState";
export declare const updateViewportReducer: (state: IViewportState, { payload }: ReturnType<typeof updateViewportAction>) => {
    width: number;
    height: number;
    x: number;
    y: number;
};
