export declare class FontLoader {
    private fonts;
    addFont(fontFamily: string, path: string, nonce?: string): void;
    loadAll(): Promise<any[]>;
    private addFontFace;
    private createId;
}
