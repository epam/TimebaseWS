import { ICommand, IHandler } from "./Handler";
export interface IHandlerMap {
    [type: string]: IHandler;
}
export declare class Bus implements IHandler {
    private handlers;
    addHandler(handler: IHandler, type: string): void;
    getHandlers(): IHandlerMap;
    handle(command: ICommand): any;
}
