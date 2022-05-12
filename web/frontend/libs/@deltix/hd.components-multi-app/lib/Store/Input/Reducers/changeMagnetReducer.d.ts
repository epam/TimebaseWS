import { changeMagnetAction } from "../inputActions";
import { IInputState } from "../inputState";
export declare const changeMagnetReducer: (state: IInputState, { payload: { magnet } }: ReturnType<typeof changeMagnetAction>) => {
    magnet: boolean;
    x: number;
    y: number;
    drag: boolean;
    onCanvas: boolean;
};
