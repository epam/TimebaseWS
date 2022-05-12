export declare class Tween {
    private lastV;
    private prolongation;
    private clock;
    private onUpdateCallbacks;
    private onCompleteCallbacks;
    private onForceCompleteCallbacks;
    private onCompleteOnceCallbacks;
    private onStartCallbacks;
    private easing;
    private liner;
    setEasing(easing: (t: number) => number): this;
    getLastV(): number;
    getEasing(): (t: number) => number;
    prolong(at?: number): this;
    startOrProlong(): this;
    reverseLoop(): this;
    loop(): this;
    duration(duration: number | (() => number)): this;
    getDuration(): () => number;
    getFullDuration(): number;
    onUpdate(callback: (value: number) => void): this;
    onComplete(callback: (tween: this) => void): this;
    onForceComplete(callback: (tween: this) => void): this;
    onCompleteOnce(callback: (tween: this) => void): this;
    onStart(callback: (tween: this) => void): this;
    start(at?: number): this;
    reverse(): this;
    pause(): this;
    isPaused(): boolean;
    resume(): this;
    /**
     * Update animation.
     */
    update(now?: number): this;
    /**
     * Return true if animation is completed. Animated is completed if she is not started.
     */
    isCompleted(): boolean;
    /**
     * Complete animation and call update callback.
     */
    complete(): this;
    /**
     * Complete animation without call on update callback.
     */
    forceComplete(): this;
    /**
     * Reset animation to initial state.
     */
    reset(): this;
    isStarted(): boolean;
    isRunning(): boolean;
    private durationThunk;
    private directionFunctor;
    private compute;
    private doComplete;
}
