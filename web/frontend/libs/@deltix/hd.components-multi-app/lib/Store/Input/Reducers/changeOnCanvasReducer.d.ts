import { changeOnCanvasAction } from "../inputActions";
import { IInputState } from "../inputState";
export declare const changeOnCanvasReducer: (state: IInputState, { payload: { onCanvas } }: ReturnType<typeof changeOnCanvasAction>) => {
    onCanvas: boolean;
    x: number;
    y: number;
    magnet: boolean;
    drag: boolean;
};
