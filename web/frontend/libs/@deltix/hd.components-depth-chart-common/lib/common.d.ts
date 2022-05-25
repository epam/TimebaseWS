import Big from 'big.js';
export declare const depthChartEpicType = "depthChartEpic";
export interface IPricesIntegral {
    price: Big;
    sum: Big;
}
export interface IDepthChartParameters {
    groupId?: string;
    orientation: EOrientations;
}
export declare enum EOrientations {
    price = "price",
    quantity = "quantity"
}
