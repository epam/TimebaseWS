import { ServiceA } from "./ServiceA";
export declare class ServiceADecoratorA {
    private wrapped;
    constructor(wrapped: ServiceA);
    doWork(a: number, b: number): string;
}
