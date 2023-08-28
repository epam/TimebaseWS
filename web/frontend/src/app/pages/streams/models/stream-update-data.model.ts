export interface streamNameUpdateData {
  streamId: string;
  newStreamName?: string;
}

export interface StreamPeriodicityUpdateData {
  streamId: string;
  period: {
    aggregation: number, 
    name: string, 
    units: string, 
    number: number
  }
}