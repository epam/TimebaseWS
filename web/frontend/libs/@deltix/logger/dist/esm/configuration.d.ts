export declare type LogLevel = 'error' | 'info' | 'trace' | 'warn' | 'debug';
export declare type LogLevelConf = Record<string, LogLevel | undefined>;
export declare const STYLES: Record<LogLevel, string>;
export declare const PRIORITY: Record<LogLevel, number>;
export declare type Appender = (time: string, level: LogLevel, ns: string | undefined, messages: any[]) => void;
