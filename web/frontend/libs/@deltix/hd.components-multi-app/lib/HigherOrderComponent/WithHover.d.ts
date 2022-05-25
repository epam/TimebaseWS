import * as React from "react";
export interface IWithHoverProps {
    width: number;
    height: number;
    children: (hovered: boolean) => JSX.Element;
}
export interface IWithHoverState {
    hovered: boolean;
}
export declare class WithHover extends React.Component<IWithHoverProps, IWithHoverState> {
    state: {
        hovered: boolean;
    };
    render(): JSX.Element;
    private toggleHover;
}
