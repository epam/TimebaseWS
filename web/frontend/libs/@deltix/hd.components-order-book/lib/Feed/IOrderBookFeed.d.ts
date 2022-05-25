import { Observable } from "rxjs";
import { IL2Package } from "../l2";
export interface IOrderBookFeed {
    subscribe(symbol: string, appId: string): Observable<IL2Package>;
}
