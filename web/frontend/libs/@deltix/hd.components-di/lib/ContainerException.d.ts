export declare class ContainerException extends Error {
    static serviceNotFound(id: string): ContainerException;
    static parameterNotFound(id: string): ContainerException;
}
