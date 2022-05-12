export declare const changePositionAction: (point: {
    x;
    y;
}) => {
    type: string;
    payload: {
        x: any;
        y: any;
    };
};
export declare const changeDragAction: (drag: boolean) => {
    type: string;
    payload: {
        drag: boolean;
    };
};
export declare const changeOnCanvasAction: (onCanvas: boolean) => {
    type: string;
    payload: {
        onCanvas: boolean;
    };
};
export declare const pointDownAction: (point: {
    x;
    y;
}) => {
    type: string;
    payload: {
        x: any;
        y: any;
    };
};
export declare const pointUpAction: (point: {
    x;
    y;
}) => {
    type: string;
    payload: {
        x: any;
        y: any;
    };
};
/**
 * API
 */
export declare const clickAction: (point: {
    x;
    y;
}) => {
    type: string;
    payload: {
        x: any;
        y: any;
    };
};
export declare const changeMagnetAction: (magnet: boolean) => {
    type: string;
    payload: {
        magnet: boolean;
    };
};
export declare const wheelAction: (x: number, delta: number, forceDelta?: boolean, isTouch?: boolean) => {
    type: string;
    payload: {
        x: number;
        delta: number;
        forceDelta: boolean;
        isTouch: boolean;
    };
};
export declare const dragMoveAction: (delta: number) => {
    type: string;
    payload: {
        delta: number;
    };
};
