import * as React from "react";
import * as PIXI from 'pixi.js';
export interface IRendererProps {
    renderer: PIXI.Renderer;
    stage: PIXI.Container;
}
export declare const RendererContext: React.Context<IRendererProps>;
