export class FrameLocationLike {
    frame;
    resolve = null;
    reject = null;
    readiness = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
    });
    get loc() {
        return this.frame?.contentWindow?.location;
    }
    get hash() {
        try {
            return this.loc?.hash || this.loc?.search || '';
        }
        catch {
            return '';
        }
    }
    get host() {
        try {
            return this.loc?.host ?? '';
        }
        catch {
            return '';
        }
    }
    get origin() {
        try {
            return this.loc?.origin ?? '';
        }
        catch {
            return '';
        }
    }
    get hostname() {
        try {
            return this.loc?.hostname ?? '';
        }
        catch {
            return '';
        }
    }
    get pathname() {
        try {
            return this.loc?.pathname ?? '';
        }
        catch {
            return '';
        }
    }
    get port() {
        try {
            return this.loc?.port ?? '';
        }
        catch {
            return '';
        }
    }
    get protocol() {
        try {
            return this.loc?.protocol ?? '';
        }
        catch {
            return '';
        }
    }
    get search() {
        try {
            return this.loc?.search ?? '';
        }
        catch {
            return '';
        }
    }
    get ready() {
        return this.readiness;
    }
    assign(url) {
        const frame = globalThis.document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = url;
        frame.onload = this.resolve;
        frame.onerror = this.reject;
        frame.onabort = this.reject;
        this.frame = frame;
        globalThis.document.body.appendChild(frame);
    }
    destroy() {
        this.reject?.();
        this.resolve = null;
        this.reject = null;
        this.frame?.remove();
    }
}
