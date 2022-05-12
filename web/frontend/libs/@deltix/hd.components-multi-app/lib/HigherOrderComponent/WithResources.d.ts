import * as PIXI from 'pixi.js';
export interface IWithResources {
    getResource(name: string): PIXI.ILoaderResource;
}
export declare const WithResources: () => (BaseComponent: any) => any;
