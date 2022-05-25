export declare const updateViewportAction: (width: number, height: number, x: number, y: number) => {
    type: string;
    payload: {
        width: number;
        height: number;
        x: number;
        y: number;
    };
};
export declare const multiAppUpdateViewportAction: (width: number, height: number) => {
    type: string;
    payload: {
        width: number;
        height: number;
    };
};
