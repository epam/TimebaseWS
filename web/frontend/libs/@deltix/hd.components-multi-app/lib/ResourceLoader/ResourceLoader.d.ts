import * as PIXI from 'pixi.js';
export declare class ResourceLoader {
    private resolveResourceCallback?;
    private nonce?;
    private loader;
    private fontLoader;
    private urlRegExp;
    constructor(resolveResourceCallback?: (name: string, path: string) => string | undefined, nonce?: string);
    addResource(name: string, path: string): void;
    addFont(fontFamily: string, path: string): void;
    loadAll(): Promise<[unknown, any[]]>;
    getResources(): PIXI.utils.Dict<PIXI.LoaderResource>;
    private loadImages;
    private resolveAbsoluteUrl;
    private isAbsoluteUrl;
    private tryResolve;
}
