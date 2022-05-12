import globalThis from 'globalthis';
import { Appender, LogLevelConf } from './configuration';
export declare const global: ReturnType<typeof globalThis> & {
    deltixLogLevel?: LogLevelConf;
    deltixLogAppenders?: Appender[];
};
