import { Appender, LogLevel } from './configuration';
export declare const setLevel: (level: LogLevel | undefined) => {
    [x: string]: LogLevel | undefined;
};
export declare const error: (...messages: any[]) => void;
export declare const warn: (...messages: any[]) => void;
export declare const debug: (...messages: any[]) => void;
export declare const trace: (...messages: any[]) => void;
export declare const info: (...messages: any[]) => void;
export declare const namespace: (name: string) => Record<LogLevel, (...messages: any[]) => void> & {
    setLevel: (ns: LogLevel | undefined) => void;
};
export declare const setAppenders: (appenders: Appender[]) => void;
