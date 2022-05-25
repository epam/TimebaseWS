import { ServiceA } from "./ServiceA";
export declare class ServiceADecoratorB {
    private wrapped;
    constructor(wrapped: ServiceA);
    doWork(a: number, b: number): string;
}
