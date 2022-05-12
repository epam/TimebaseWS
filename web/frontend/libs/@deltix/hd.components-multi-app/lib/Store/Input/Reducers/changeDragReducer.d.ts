import { changeDragAction } from "../inputActions";
import { IInputState } from "../inputState";
export declare const changeDragReducer: (state: IInputState, { payload: { drag } }: ReturnType<typeof changeDragAction>) => {
    drag: boolean;
    x: number;
    y: number;
    magnet: boolean;
    onCanvas: boolean;
};
