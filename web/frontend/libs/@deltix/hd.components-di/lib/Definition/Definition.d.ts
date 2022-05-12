import { MethodCall } from './MethodCall';
import { Tag } from './Tag';
export declare class Definition<T> {
    private arguments;
    private shared;
    /**
     * Service id.
     */
    private id;
    private calls;
    private tags;
    private decorates;
    private decorationPriority;
    private factoryBuilder;
    private resource?;
    private factory?;
    /**
     * @param ctr Construct of class.
     */
    setClass(ctr: any): this;
    /**
     * @param method    Method name of factory.
     * @param ctr       Constructor function of factory.
     */
    setFactory(method: string, ctr: any): this;
    setId(id: string): this;
    setDecorates(wrappedId: string): this;
    setDecorationPriority(priority: number): this;
    markAsNotShared(): this;
    addArguments(...args: any[]): this;
    addMethodCalls(...calls: MethodCall[]): this;
    addTags(...tags: Tag[]): this;
    getResource(): any;
    getArguments(): any[];
    getId(): string;
    getCalls(): any[];
    getTags(): any[];
    getTagsWithName(name: string): any[];
    getFactoryBuilder(): any;
    getFactory(): any;
    isShared(): boolean;
    getDecorates(): string | undefined;
    getDecorationPriority(): number;
    clone(): Definition<unknown>;
}
