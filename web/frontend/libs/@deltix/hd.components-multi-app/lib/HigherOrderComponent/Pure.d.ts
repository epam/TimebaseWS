export declare const Pure: () => (WrappedComponent: any) => {
    new (): {
        [x: string]: any;
        shouldComponentUpdate(nextProps: any, nextState: any): boolean;
    };
    [x: string]: any;
    displayName: string;
};
/**
 * @param {Object} thisProps
 * @param {Object} nextProps
 * @param {Object} thisState
 * @param {Object} nextState
 */
export declare function shallowEqual(thisProps: any, nextProps: any, thisState: any, nextState: any): boolean;
/**
 * @param {Object} thisState
 * @param {Object} nextState
 * @returns {Boolean}
 */
export declare function shallowEqualState(thisState: any, nextState: any): boolean;
/**
 * Perform a shallow equal to every prop that is not a React Element
 * This will return true for unchanged props (where the only changes are the react elements props like 'children')
 * @param {Object} thisProps
 * @param {Object} nextProps
 * @returns {Boolean}
 */
export declare function shallowEqualWithoutReactElements(thisProps: any, nextProps: any): boolean;
