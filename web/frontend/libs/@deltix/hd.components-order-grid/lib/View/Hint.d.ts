import React from 'react';
interface IHint {
    hintText: string;
    hintX: number;
    hintY: number;
    hintWidth: number;
    hintHeight: number;
}
export declare const Hint: React.MemoExoticComponent<({ hintHeight, hintText, hintWidth, hintX, hintY }: IHint) => JSX.Element>;
export {};
