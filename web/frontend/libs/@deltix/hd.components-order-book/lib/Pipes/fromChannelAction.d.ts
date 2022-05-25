/**
 * Extract all action from provide channel.
 */
export declare const fromChannelAction: (c: string) => import("rxjs").UnaryFunction<import("rxjs").Observable<{
    channel: string;
    action: import("redux").AnyAction;
}>, import("rxjs").Observable<import("redux").AnyAction>>;
