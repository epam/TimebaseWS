export declare const defaultOrderGrid: {
    background: {
        color: number;
    };
    quantity: {
        buy: {
            ceilPart: {
                color: number;
            };
            decimalPart: {
                color: number;
            };
            zeroPart: {
                color: number;
            };
        };
        sell: {
            ceilPart: {
                color: number;
            };
            decimalPart: {
                color: number;
            };
            zeroPart: {
                color: number;
            };
        };
    };
    price: {
        buy: {
            color: number;
        };
        sell: {
            color: number;
        };
    };
    exchange: {
        color: number;
    };
    hovered: {
        color: number;
        alpha: number;
    };
    highlighted: {
        color: number;
        alpha: number;
    };
    spreadLine: {
        border: {
            color: number;
            alpha: number;
        };
        background: {
            color: number;
        };
        text: {
            color: number;
        };
    };
};
export declare type OrderGridTheme = typeof defaultOrderGrid;
