import { StorageBackend } from '@openid/appauth';
export declare class TempStorageBackend extends StorageBackend {
    protected storage: Record<string, string>;
    getItem(name: string): Promise<string>;
    removeItem(name: string): Promise<void>;
    clear(): Promise<void>;
    setItem(name: string, value: string): Promise<void>;
}
