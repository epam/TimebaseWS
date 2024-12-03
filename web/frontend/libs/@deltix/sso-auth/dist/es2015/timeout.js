import { TimeoutError } from './errors';
export const timeoutAsync = (t) => new Promise((resolve, reject) => {
    setTimeout(() => {
        reject(new TimeoutError());
    }, t);
});
