export declare class Clock {
    private startedAt;
    private pausedAt;
    private pauseDuration;
    start(at?: number): void;
    startAt(): number;
    isStarted(): boolean;
    pause(at?: number): void;
    isRunning(): boolean;
    resume(at?: number): void;
    isPaused(): boolean;
    left(now?: number): number;
    reset(): void;
    private getPauseDuration;
}
