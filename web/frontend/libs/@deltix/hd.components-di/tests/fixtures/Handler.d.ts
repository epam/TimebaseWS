import { ServiceA } from "./ServiceA";
export interface ICommand {
    type: string;
    payload: any;
}
export interface IHandler {
    handle(command: ICommand): any;
}
export declare class Handler implements IHandler {
    private serviceA;
    constructor(serviceA: ServiceA);
    handle(command: {
        payload: {
            a: number;
            b: number;
        };
        type: "SUM";
    }): string;
}
