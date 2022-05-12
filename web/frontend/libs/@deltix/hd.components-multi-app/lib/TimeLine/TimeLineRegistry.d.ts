import { Tween } from "./Tween";
export declare class TweenRegistry {
    private tweens;
    create(): Tween;
    add(tween: Tween): void;
    remove(...tweens: Tween[]): void;
    update(time?: number): void;
    getAll(): Tween[];
    forceCompleteAll(): void;
    completeAll(): void;
    removeAll(): void;
}
