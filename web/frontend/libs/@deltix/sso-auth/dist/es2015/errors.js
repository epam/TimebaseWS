export class TimeoutError extends Error {
    constructor() {
        super('Timeout occurs');
    }
}
export class NoResponseError extends Error {
    constructor() {
        super('No response info');
    }
}
