/**
 * Needed for sync server time and browser time.
 */
export declare class SyncTime {
    private offset;
    private freezeTime;
    /**
     * @param serverTime Current time on server.
     */
    sync(serverTime: number): void;
    /**
     * @returns Return current timestamp with server offset.
     */
    now: () => number;
    freeze(freezeTime?: number): void;
}
export declare const ServerTime: SyncTime;
