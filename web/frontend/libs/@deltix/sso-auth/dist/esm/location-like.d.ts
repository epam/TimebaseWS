import { LocationLike } from '@openid/appauth';
export interface ILocationLike extends LocationLike {
    get ready(): Promise<void>;
    destroy(): void;
}
export declare class FrameLocationLike implements ILocationLike {
    protected frame: HTMLIFrameElement | undefined;
    protected resolve: (() => void) | null;
    protected reject: (() => void) | null;
    protected readiness: Promise<void>;
    protected get loc(): Location;
    get hash(): string;
    get host(): string;
    get origin(): string;
    get hostname(): string;
    get pathname(): string;
    get port(): string;
    get protocol(): string;
    get search(): string;
    get ready(): Promise<void>;
    assign(url: string): void;
    destroy(): void;
}
