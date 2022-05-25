import * as React from "react";
export declare const skipRender = "@@SKIP";
export declare const SkipRenderProps: {
    "@@SKIP": boolean;
};
export interface ISkipRenderProps {
    render: any;
    skipRender: any;
    [key: string]: any;
}
export declare class SkipRender extends React.Component<ISkipRenderProps> {
    render(): any;
}
export declare const connectWithSkip: (selector: any, Component: any, staticProps?: {}) => import("react-redux").ConnectedComponent<(props: any) => JSX.Element, import("react-redux").Omit<any, "dispatch">>;
