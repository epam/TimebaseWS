import * as React from "react";
export interface IOverflowHiddenProps {
    width: number;
    height: number;
}
export declare class OverflowHidden extends React.PureComponent<IOverflowHiddenProps> {
    private ref;
    private mask;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
