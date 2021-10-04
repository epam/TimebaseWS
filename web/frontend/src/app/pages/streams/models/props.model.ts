export interface PropsModel {
  name: string;
  key: string;
  description: string;
  distributionFactor: number;
  bufferOptions: {
    initialBufferSize: number;
    maxBufferSize: number;
    maxBufferTimeDepth: number;
    lossLess: boolean;
  };
  scope: string;
  periodicity: {
    interval: string;
    type: string;
  };
  highAvailability: boolean;
  owner: string;
  range: {
    end: string;
    start: string;
  };
}
