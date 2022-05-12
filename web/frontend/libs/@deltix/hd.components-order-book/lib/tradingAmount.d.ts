import Big from "big.js";
export declare enum OrderType {
    MARKET = "market",
    STOP = "stop",
    LIMIT = "limit"
}
export interface ITradingAmountRequest {
    id: number;
    symbol: string;
    quantity: Big;
    price?: Big;
    type: OrderType;
    exchange?: string;
}
export interface ITradingAmountValue {
    price: Big;
    amount: Big;
}
export interface ITradingAmount {
    id: number;
    buyPassive?: ITradingAmountValue[];
    buyAggressive?: ITradingAmountValue[];
    sellPassive?: ITradingAmountValue[];
    sellAggressive?: ITradingAmountValue[];
}
