import Big from 'big.js';
export declare enum L2Action {
    update = "update",
    insert = "insert",
    delete = "delete",
    delete_from = "delete_from",
    delete_thru = "delete_thru",
    trade = "trade"
}
export declare enum L2PackageType {
    snapshot_full_refresh = "snapshot_full_refresh",
    incremental_update = "incremental_update"
}
export interface IL2Message {
    side: L2MessageSide;
    level: number;
    price: Big;
    quantity?: Big;
    action: L2Action;
    exchange_id: string;
    timestamp?: number;
    number_of_orders?: number;
}
export interface IL2Package {
    sequence_number: number;
    security_id: string;
    timestamp: number;
    type: L2PackageType;
    entries: IL2Message[];
    exchange_id?: string;
}
export declare enum L2MessageSide {
    buy = "buy",
    sell = "sell"
}
