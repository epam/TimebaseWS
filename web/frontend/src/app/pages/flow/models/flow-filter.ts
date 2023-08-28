export interface FlowFilter {
  topology: string;
  nodes: {id: string, name: string}[];
  rpsType: string;
  rpsVal: number;
}
