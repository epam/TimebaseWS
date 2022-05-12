export declare const defaultTradeHistory: {
    background: {
        color: number;
    };
    price: {
        buy: {
            color: number;
        };
        sell: {
            color: number;
        };
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
    hovered: {
        color: number;
        alpha: number;
    };
    exchange: {
        color: number;
    };
    time: {
        buy: {
            color: number;
        };
        sell: {
            color: number;
        };
    };
};
export declare type TradeHistoryTheme = typeof defaultTradeHistory;
