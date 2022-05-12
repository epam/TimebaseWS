import Big from 'big.js';
import { IRecord } from '../orderBookState';
export declare const recordSearchMap: {
    buy: import("@deltix/hd.components-utils").BinarySearch<IRecord, Big>;
    sell: import("@deltix/hd.components-utils").BinarySearch<IRecord, Big>;
};
