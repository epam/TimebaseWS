import { EThemes } from '@deltix/hd.components-common';
import { Container } from '@deltix/hd.components-di';
import * as React from 'react';
import { EEmbeddableAppState, IEmbeddableAppPosition } from '../Store/MultiApp/IMultiAppState';
import { embeddableAppFailedAction } from '../Store/MultiApp/multiAppActions';
export interface IEmbeddableContainerProps {
    root: React.SFC<any> | React.ComponentClass<any> | string;
    container?: Container;
    state: EEmbeddableAppState;
    position: IEmbeddableAppPosition;
    type: string;
    id: string;
    theme?: EThemes;
    store: any;
    onError?: typeof embeddableAppFailedAction;
}
export declare class EmbeddableContainer extends React.Component<IEmbeddableContainerProps> {
    static getDerivedStateFromError(error: any): {
        hasError: boolean;
    };
    private store;
    componentDidCatch(error: Error): void;
    render(): JSX.Element;
    private setRef;
    private getTextForState;
}
