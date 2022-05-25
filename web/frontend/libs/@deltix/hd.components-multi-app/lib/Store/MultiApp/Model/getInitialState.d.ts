import { Reducer } from 'redux';
import { IEmbeddableAppPosition } from '../IMultiAppState';
export declare const getInitialState: <T>(reducer: Reducer<T, import("redux").AnyAction>, { width, height, x, y }: IEmbeddableAppPosition) => {
    app: T;
    viewport: {
        width: number;
        height: number;
        x: number;
        y: number;
    };
    input: {
        x: number;
        y: number;
        magnet: boolean;
        drag: boolean;
        onCanvas: boolean;
    };
};
