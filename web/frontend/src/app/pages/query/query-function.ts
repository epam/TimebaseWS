export interface QueryFunction {
  name: string;
  stateful: boolean;
  arguments?: QueryFunctionArgument[],
  initArguments?: QueryFunctionArgument[]
}

interface QueryFunctionArgument {
  defaultValue: any,
  name: string,
  type: {
    encoding: string,
    nullable: boolean,
    name: string,
    types: any,
    elementType: any
  }
};