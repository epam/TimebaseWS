import { StorageBackend } from '@openid/appauth';
export class TempStorageBackend extends StorageBackend {
    constructor() {
        super(...arguments);
        this.storage = {};
    }
    getItem(name) {
        return Promise.resolve(this.storage[name]);
    }
    removeItem(name) {
        delete this.storage[name];
        return Promise.resolve();
    }
    clear() {
        this.storage = {};
        return Promise.resolve();
    }
    setItem(name, value) {
        this.storage[name] = value;
        return Promise.resolve();
    }
}
