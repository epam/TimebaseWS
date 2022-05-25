import { changePositionAction } from "../inputActions";
import { IInputState } from "../inputState";
export declare const changePositionReducer: (state: IInputState, { payload: { x, y } }: ReturnType<typeof changePositionAction>) => {
    x: any;
    y: any;
    magnet: boolean;
    drag: boolean;
    onCanvas: boolean;
};
