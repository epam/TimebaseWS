import * as PIXI from 'pixi.js';
import { IPoint } from './IPoint';
export interface IInteractiveParams {
    hitArea: PIXI.Rectangle;
    buttonMode: boolean;
    onMove?: (e: IMoveEvent) => void;
    onPointerDown?: (e: IPointerDownEvent) => void;
    onPointerUp?: (e: IPointerUpEvent) => void;
    onClick?: (e: IClickEvent) => void;
    onDragStart?: (e: IDragStartEvent) => void;
    onDragMove?: (e: IDragMoveEvent) => void;
    onDragEnd?: (e: IDragEndEvent) => void;
    onPointerOver?: () => void;
    onPointerOut?: () => void;
    onWheel?: (e: IWheelEvent) => void;
}
export interface IMoveEvent extends IPoint {
}
export interface IWheelEvent extends IPoint {
    delta: number;
    forceDelta?: boolean;
    isTouch?: boolean;
}
export interface IPointerDownEvent extends IPoint {
}
export interface IPointerUpEvent extends IPoint {
}
export interface IClickEvent extends IPoint {
}
export interface IDragStartEvent extends IPoint {
}
export interface IDragMoveEvent extends IPoint {
    dragX: number;
    dragY: number;
}
export interface IDragEndEvent extends IPoint {
}
export declare class InteractionManager {
    private stage;
    private params;
    private renderer;
    private subject;
    private dragging;
    private startX;
    private startY;
    private x;
    private y;
    private data;
    private inTouch;
    private touchDistance;
    constructor(stage: PIXI.Container, params: IInteractiveParams, renderer: any, subject: PIXI.Container);
    destroy(): void;
    private onWheel;
    private stopDragging;
    private onDragStart;
    private onDragEnd;
    private onDragMove;
    private onMove;
    private onPointerDown;
    private onPointerUp;
    private onClick;
    private onPointerOut;
    private handlePointEvent;
    private call;
    private isOutCanvas;
    private handleTouchEvent;
    private onTouchMove;
    private onTouchEnd;
    private onTouchCancel;
    private onTouchStart;
}
